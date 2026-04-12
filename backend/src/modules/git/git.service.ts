import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { simpleGit, SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

export interface GitFileTreeEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface GitCommitInfo {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  body?: string;
}

export interface DiffLine {
  type: 'add' | 'del' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffFile {
  filePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private readonly storagePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>('git.storagePath', '/data/repositories');
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  getRepoPath(ownerName: string, repoSlug: string): string {
    return path.join(this.storagePath, ownerName, `${repoSlug}.git`);
  }

  private getGit(repoPath: string): SimpleGit {
    return simpleGit(repoPath, {
      config: ['user.name=SpectraGit', 'user.email=noreply@spectragit.local'],
    });
  }

  async initRepository(
    ownerName: string,
    repoSlug: string,
    defaultBranch: string = 'main',
    initReadme: boolean = false,
  ): Promise<string> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }

    fs.mkdirSync(repoPath, { recursive: true });

    const git = this.getGit(repoPath);
    await git.init();
    await git.addConfig('init.defaultBranch', defaultBranch);
    await git.addConfig('user.name', 'SpectraGit');
    await git.addConfig('user.email', 'noreply@spectragit.local');
    // Allow pushes to the checked-out branch; git will also update the
    // working tree so the on-disk state stays consistent with HEAD.
    await git.addConfig('receive.denyCurrentBranch', 'updateInstead');
    await git.checkout(['-b', defaultBranch]);

    if (initReadme) {
      const readmePath = path.join(repoPath, 'README.md');
      fs.writeFileSync(readmePath, `# ${repoSlug}\n`);
      await git.add('.');
      await git.commit('Initial commit');
    }

    this.logger.log(`Repository initialized: ${ownerName}/${repoSlug}`);
    return repoPath;
  }

  async deleteRepository(ownerName: string, repoSlug: string): Promise<void> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      this.logger.log(`Repository deleted: ${ownerName}/${repoSlug}`);
    }
  }

  async moveRepository(
    oldOwner: string,
    oldSlug: string,
    newOwner: string,
    newSlug: string,
  ): Promise<void> {
    const oldPath = this.getRepoPath(oldOwner, oldSlug);
    const newPath = this.getRepoPath(newOwner, newSlug);

    if (!fs.existsSync(oldPath)) {
      throw new InternalServerErrorException(
        `Source repository not found on disk: ${oldOwner}/${oldSlug}`,
      );
    }

    const newOwnerDir = path.dirname(newPath);
    if (!fs.existsSync(newOwnerDir)) {
      fs.mkdirSync(newOwnerDir, { recursive: true });
    }

    fs.renameSync(oldPath, newPath);
    this.logger.log(`Repository moved: ${oldOwner}/${oldSlug} -> ${newOwner}/${newSlug}`);
  }

  /**
   * Clone a local repository into another local path (fast filesystem copy).
   * Used for fork operations.
   */
  async cloneLocal(
    sourceOwner: string,
    sourceSlug: string,
    destOwner: string,
    destSlug: string,
  ): Promise<string> {
    const sourcePath = this.getRepoPath(sourceOwner, sourceSlug);
    const destPath = this.getRepoPath(destOwner, destSlug);

    if (!fs.existsSync(sourcePath)) {
      throw new InternalServerErrorException(
        `Source repository not found on disk: ${sourceOwner}/${sourceSlug}`,
      );
    }

    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }

    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const git = simpleGit(parentDir, {
      config: ['user.name=SpectraGit', 'user.email=noreply@spectragit.local'],
    });
    await git.clone(sourcePath, destPath, ['--local']);

    this.logger.log(`Forked repository: ${sourceOwner}/${sourceSlug} → ${destOwner}/${destSlug}`);
    return destPath;
  }

  /**
   * Clone a remote repository (full history + all branches) into the local
   * storage path.  The cloneUrl should contain credentials inline (e.g.
   * https://x-access-token:<token>@github.com/owner/repo.git).
   */
  async cloneFromUrl(
    ownerName: string,
    repoSlug: string,
    cloneUrl: string,
    onProgress?: (percent: number) => Promise<void>,
  ): Promise<void> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }

    const parentDir = path.dirname(repoPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Clone into repoPath (creates the working tree directory)
    const git = simpleGit(parentDir, {
      config: ['user.name=SpectraGit', 'user.email=noreply@spectragit.local'],
      progress: onProgress
        ? ({ progress }) => {
            // simple-git progress is 0-100 per stage; map to 5-60 range
            const mapped = Math.round(5 + (progress / 100) * 55);
            onProgress(mapped).catch(() => {});
          }
        : undefined,
    });
    await git.clone(cloneUrl, repoPath, ['--progress']);

    // Create local tracking branches for every remote branch
    const repoGit = this.getGit(repoPath);
    // Allow pushes to the checked-out branch; git will also update the
    // working tree so the on-disk state stays consistent with HEAD.
    await repoGit.addConfig('receive.denyCurrentBranch', 'updateInstead');
    const remoteRefs = await repoGit.branch(['-r']);
    for (const remoteBranch of remoteRefs.all) {
      if (remoteBranch.includes('HEAD')) continue;
      const localName = remoteBranch.replace(/^origin\//, '');
      try {
        await repoGit.checkout(['-b', localName, '--track', remoteBranch]);
      } catch {
        // Already checked out (default branch was checked out by clone)
      }
    }

    this.logger.log(`Cloned repository: ${ownerName}/${repoSlug}`);
  }

  /**
   * Returns every local branch together with its HEAD commit SHA.
   */
  async getLocalBranchesWithSha(
    ownerName: string,
    repoSlug: string,
  ): Promise<{ name: string; sha: string }[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    try {
      const summary = await git.branchLocal();
      return Object.entries(summary.branches).map(([name, info]) => ({
        name,
        sha: info.commit,
      }));
    } catch {
      return [];
    }
  }

  async getFileTree(
    ownerName: string,
    repoSlug: string,
    branch: string,
    dirPath: string = '',
  ): Promise<GitFileTreeEntry[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    try {
      const treeRef = dirPath ? `${branch}:${dirPath}` : branch;
      // Use full ls-tree output to get type + name in one call, and -z for
      // null-terminated output so filenames with special chars aren't quoted.
      const result = await git.raw(['ls-tree', '-z', treeRef]);

      if (!result.trim()) return [];

      const entries: GitFileTreeEntry[] = [];
      // -z uses \0 as delimiter; split and filter empty trailing entry
      const lines = result.split('\0').filter(Boolean);

      for (const line of lines) {
        // Format: "<mode> <type> <hash>\t<name>"
        const tabIdx = line.indexOf('\t');
        if (tabIdx === -1) continue;
        const meta = line.slice(0, tabIdx);
        const name = line.slice(tabIdx + 1);
        const objType = meta.split(' ')[1]; // "blob" or "tree"
        const fullPath = dirPath ? `${dirPath}/${name}` : name;
        entries.push({
          name,
          path: fullPath,
          type: objType === 'tree' ? 'directory' : 'file',
        });
      }

      return entries;
    } catch (err) {
      this.logger.error(`getFileTree failed: ${(err as Error).message}`);
      return [];
    }
  }

  async getFileContent(
    ownerName: string,
    repoSlug: string,
    branch: string,
    filePath: string,
  ): Promise<string> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    return git.show([`${branch}:${filePath}`]);
  }

  /** Return the size (in bytes) of an object at branch:filePath. */
  async getFileSize(
    ownerName: string,
    repoSlug: string,
    branch: string,
    filePath: string,
  ): Promise<number> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    const result = await git.raw(['cat-file', '-s', `${branch}:${filePath}`]);
    return parseInt(result.trim(), 10) || 0;
  }

  /** Return raw binary file content as a Buffer. */
  async getFileBinary(
    ownerName: string,
    repoSlug: string,
    branch: string,
    filePath: string,
  ): Promise<Buffer> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    // Get the blob hash, then use cat-file to stream it
    const blobHash = await git.raw(['rev-parse', `${branch}:${filePath}`]);
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync('git', ['cat-file', 'blob', blobHash.trim()], {
      cwd: repoPath,
      encoding: 'buffer',
      maxBuffer: 50 * 1024 * 1024,
    });
    return stdout;
  }

  async getCommitLog(
    ownerName: string,
    repoSlug: string,
    branch: string,
    limit: number = 30,
    offset: number = 0,
  ): Promise<GitCommitInfo[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    try {
      // Use git's %xNN escapes for separators so they survive the process arg boundary.
      const fmt = '%x1f%H%x1f%s%x1f%aN%x1f%ae%x1f%aI%x1f%b%x1e';
      const SEP = '\x1f';
      const RS = '\x1e';
      const safeLimit = Number.isFinite(limit) ? limit : 30;
      const safeOffset = Number.isFinite(offset) ? offset : 0;
      const result = await git.raw([
        'log',
        branch,
        `--max-count=${safeLimit}`,
        `--skip=${safeOffset}`,
        `--format=${fmt}`,
      ]);

      if (!result.trim()) return [];

      return result
        .split(RS)
        .filter((r) => r.includes(SEP))
        .map((record) => {
          const p = record.split(SEP);
          return {
            sha: p[1]?.trim() ?? '',
            message: p[2]?.trim() ?? '',
            author: p[3]?.trim() ?? '',
            authorEmail: p[4]?.trim() ?? '',
            date: p[5]?.trim() ?? '',
            body: p[6]?.trim() ?? undefined,
          };
        })
        .filter((c) => c.sha);
    } catch {
      return [];
    }
  }

  async getCommitDetail(
    ownerName: string,
    repoSlug: string,
    sha: string,
  ): Promise<GitCommitInfo | null> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    try {
      const fmt = '%x1f%H%x1f%s%x1f%aN%x1f%ae%x1f%aI%x1f%b';
      const SEP = '\x1f';
      const result = await git.raw(['log', sha, '--max-count=1', `--format=${fmt}`]);
      if (!result.trim()) return null;

      const p = result.split(SEP);
      if (!p[1]?.trim()) return null;

      return {
        sha: p[1].trim(),
        message: p[2]?.trim() ?? '',
        author: p[3]?.trim() ?? '',
        authorEmail: p[4]?.trim() ?? '',
        date: p[5]?.trim() ?? '',
        body: p[6]?.trim() ?? undefined,
      };
    } catch {
      return null;
    }
  }

  async getCommitDiff(ownerName: string, repoSlug: string, sha: string): Promise<DiffFile[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    let raw: string;
    try {
      // Try diff against parent first; falls back for initial commit
      raw = await git.diff([`${sha}~1`, sha, '--no-color']);
    } catch {
      // Initial commit has no parent — use git show which works universally
      raw = await git.raw(['show', sha, '-p', '--format=', '--no-color']);
    }

    return this.parseDiff(raw);
  }

  private parseDiff(rawDiff: string): DiffFile[] {
    const files: DiffFile[] = [];
    if (!rawDiff.trim()) return files;

    // Split on "diff --git" markers
    const fileDiffs = rawDiff.split(/^diff --git /m).filter(Boolean);

    for (const fileDiff of fileDiffs) {
      const lines = fileDiff.split('\n');
      const gitLine = lines[0]; // "a/path b/path"
      const gitMatch = gitLine.match(/^a\/(.+) b\/(.+)$/);
      let filePath = gitMatch ? gitMatch[2] : (gitLine.split(' ').pop() ?? 'unknown');

      let status: DiffFile['status'] = 'modified';
      if (lines.some((l) => l.startsWith('new file mode'))) status = 'added';
      else if (lines.some((l) => l.startsWith('deleted file mode'))) status = 'deleted';
      else if (lines.some((l) => l.startsWith('rename to '))) {
        status = 'renamed';
        const renameLine = lines.find((l) => l.startsWith('rename to '));
        if (renameLine) filePath = renameLine.slice('rename to '.length);
      }

      const hunks: DiffHunk[] = [];
      let currentHunk: DiffHunk | null = null;
      let additions = 0;
      let deletions = 0;
      let oldLine = 0;
      let newLine = 0;

      for (const line of lines) {
        if (line.startsWith('@@ ')) {
          const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
          currentHunk = { header: line, lines: [] };
          hunks.push(currentHunk);
          oldLine = m ? parseInt(m[1], 10) : 1;
          newLine = m ? parseInt(m[2], 10) : 1;
        } else if (currentHunk) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            currentHunk.lines.push({
              type: 'add',
              content: line.slice(1),
              newLineNumber: newLine++,
            });
            additions++;
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            currentHunk.lines.push({
              type: 'del',
              content: line.slice(1),
              oldLineNumber: oldLine++,
            });
            deletions++;
          } else if (line !== '\\ No newline at end of file') {
            currentHunk.lines.push({
              type: 'context',
              content: line.slice(1),
              oldLineNumber: oldLine++,
              newLineNumber: newLine++,
            });
          }
        }
      }

      files.push({ filePath, status, additions, deletions, hunks });
    }

    return files;
  }

  async getDiffBetween(
    ownerName: string,
    repoSlug: string,
    base: string,
    head: string,
  ): Promise<string> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    return git.diff([base, head]);
  }

  async getDiffBetweenFiles(
    ownerName: string,
    repoSlug: string,
    base: string,
    head: string,
  ): Promise<DiffFile[]> {
    const raw = await this.getDiffBetween(ownerName, repoSlug, base, head).catch(() => '');
    return this.parseDiff(raw);
  }

  async getBranches(ownerName: string, repoSlug: string): Promise<string[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    try {
      const result = await git.branch();
      return result.all;
    } catch {
      return [];
    }
  }

  async createBranch(
    ownerName: string,
    repoSlug: string,
    branchName: string,
    startPoint: string,
  ): Promise<void> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    await git.branch([branchName, startPoint]);
  }

  async deleteBranch(ownerName: string, repoSlug: string, branchName: string): Promise<void> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    await git.deleteLocalBranch(branchName, true);
  }

  async getTags(ownerName: string, repoSlug: string): Promise<string[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    const result = await git.tags();
    return result.all;
  }

  async createTag(
    ownerName: string,
    repoSlug: string,
    tagName: string,
    commitSha: string,
    message?: string,
  ): Promise<void> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    if (message) {
      await git.tag(['-a', tagName, commitSha, '-m', message]);
    } else {
      await git.tag([tagName, commitSha]);
    }
  }

  async deleteTag(ownerName: string, repoSlug: string, tagName: string): Promise<void> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    await git.tag(['-d', tagName]);
  }

  async getTagDetail(
    ownerName: string,
    repoSlug: string,
    tagName: string,
  ): Promise<{
    commitSha: string;
    message: string | null;
    taggerName: string | null;
    taggerDate: string | null;
  }> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    try {
      const raw = await git.raw([
        'for-each-ref',
        `refs/tags/${tagName}`,
        '--format=%(objectname)%0a%(*objectname)%0a%(contents)%0a%(taggername)%0a%(taggerdate:iso)',
      ]);
      const lines = raw.trim().split('\n');
      const dereferenced = lines[1] || lines[0];
      const commitSha = dereferenced || lines[0];
      return {
        commitSha: commitSha.substring(0, 40),
        message: lines[2] || null,
        taggerName: lines[3] || null,
        taggerDate: lines[4] || null,
      };
    } catch {
      return { commitSha: '', message: null, taggerName: null, taggerDate: null };
    }
  }

  async getHeadCommitSha(
    ownerName: string,
    repoSlug: string,
    branch: string,
  ): Promise<string | null> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    try {
      const result = await git.revparse([branch]);
      return result.trim();
    } catch {
      return null;
    }
  }

  async checkMergeConflicts(
    ownerName: string,
    repoSlug: string,
    source: string,
    target: string,
  ): Promise<boolean> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    try {
      await git.raw(['merge-tree', target, source, target]);
      return false;
    } catch {
      return true;
    }
  }

  async mergeBranches(
    ownerName: string,
    repoSlug: string,
    source: string,
    target: string,
    squash: boolean = false,
  ): Promise<string> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    await git.checkout(target);

    if (squash) {
      await git.merge([source, '--squash']);
      await git.commit(`Squash merge ${source} into ${target}`);
    } else {
      await git.merge([source, '--no-ff', '-m', `Merge ${source} into ${target}`]);
    }

    const result = await git.revparse(['HEAD']);
    return result.trim();
  }

  /**
   * Compute language breakdown by counting bytes of each file extension
   * in the repository tree. Returns a map of language name → byte count.
   */
  async getLanguageBreakdown(
    ownerName: string,
    repoSlug: string,
    branch: string,
  ): Promise<Record<string, number>> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    try {
      // Try the requested branch first; fall back to HEAD for repos whose
      // DB default-branch name doesn't match the actual ref yet (e.g. an
      // empty repo, or one initialized with 'master' instead of 'main').
      let treeRef = branch;
      try {
        await git.raw(['rev-parse', '--verify', branch]);
      } catch {
        // Branch ref doesn't resolve – try HEAD instead
        try {
          await git.raw(['rev-parse', '--verify', 'HEAD']);
          treeRef = 'HEAD';
        } catch {
          // Repo has no commits at all; nothing to analyse
          return {};
        }
      }

      // ls-tree -r -l -z lists all blobs with sizes, null-terminated
      const result = await git.raw(['ls-tree', '-r', '-l', '-z', treeRef]);
      if (!result.trim()) return {};

      const extLangMap: Record<string, string> = {
        ts: 'TypeScript',
        tsx: 'TypeScript',
        js: 'JavaScript',
        jsx: 'JavaScript',
        py: 'Python',
        rb: 'Ruby',
        java: 'Java',
        kt: 'Kotlin',
        kts: 'Kotlin',
        go: 'Go',
        rs: 'Rust',
        c: 'C',
        h: 'C',
        cpp: 'C++',
        cc: 'C++',
        cs: 'C#',
        swift: 'Swift',
        m: 'Objective-C',
        php: 'PHP',
        scala: 'Scala',
        clj: 'Clojure',
        ex: 'Elixir',
        exs: 'Elixir',
        hs: 'Haskell',
        lua: 'Lua',
        r: 'R',
        dart: 'Dart',
        vue: 'Vue',
        svelte: 'Svelte',
        css: 'CSS',
        scss: 'SCSS',
        less: 'Less',
        html: 'HTML',
        htm: 'HTML',
        xml: 'XML',
        json: 'JSON',
        yaml: 'YAML',
        yml: 'YAML',
        toml: 'TOML',
        md: 'Markdown',
        mdx: 'Markdown',
        sql: 'SQL',
        sh: 'Shell',
        bash: 'Shell',
        zsh: 'Shell',
        ps1: 'PowerShell',
        bat: 'Batch',
        dockerfile: 'Dockerfile',
        prisma: 'Prisma',
        graphql: 'GraphQL',
        gql: 'GraphQL',
        proto: 'Protocol Buffers',
        tf: 'HCL',
        zig: 'Zig',
        nim: 'Nim',
        pl: 'Perl',
        pm: 'Perl',
        erl: 'Erlang',
      };

      const breakdown: Record<string, number> = {};
      const lines = result.split('\0').filter(Boolean);

      for (const line of lines) {
        // Format: "<mode> <type> <hash> <size>\t<name>"
        const tabIdx = line.indexOf('\t');
        if (tabIdx === -1) continue;
        const meta = line.slice(0, tabIdx).trim();
        const name = line.slice(tabIdx + 1);

        const parts = meta.split(/\s+/);
        if (parts[1] !== 'blob') continue;
        const size = parseInt(parts[3], 10) || 0;

        const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : name.toLowerCase();
        const lang = extLangMap[ext];
        if (lang) {
          breakdown[lang] = (breakdown[lang] || 0) + size;
        }
      }

      return breakdown;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      // Silent for expected "empty repo / bad ref" cases
      if (!msg.includes('Not a valid object name') && !msg.includes('does not have any commits')) {
        this.logger.error(`getLanguageBreakdown failed: ${msg}`);
      }
      return {};
    }
  }

  /**
   * Return all commit dates (YYYY-MM-DD) authored by the given email across
   * ALL branches of a repository, within the last `days` days.
   * Uses `--author` regex matched against the committer email.
   */
  async getCommitDatesByAuthor(
    ownerName: string,
    repoSlug: string,
    authorEmail: string,
    days: number = 365,
  ): Promise<string[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    if (!fs.existsSync(repoPath)) return [];
    const git = this.getGit(repoPath);
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];
      // --all covers every branch; --no-merges avoids double-counting;
      // --format=%ad with --date=short gives YYYY-MM-DD
      const result = await git.raw([
        'log',
        '--all',
        '--no-merges',
        `--author=${authorEmail}`,
        `--after=${sinceStr}`,
        '--format=%ad',
        '--date=short',
      ]);
      if (!result.trim()) return [];
      return result.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Return unique contributor names + emails from the commit log.
   */
  async getContributors(
    ownerName: string,
    repoSlug: string,
    branch: string,
  ): Promise<{ name: string; email: string; commits: number }[]> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);

    try {
      // shortlog -sne gives count + author + email
      const result = await git.raw(['shortlog', '-sne', '--no-merges', branch]);
      if (!result.trim()) return [];

      return result
        .trim()
        .split('\n')
        .map((line) => {
          const match = line.trim().match(/^(\d+)\t(.+?)\s+<(.+?)>$/);
          if (!match) return null;
          return { name: match[2], email: match[3], commits: parseInt(match[1], 10) };
        })
        .filter(Boolean) as { name: string; email: string; commits: number }[];
    } catch {
      return [];
    }
  }
}
