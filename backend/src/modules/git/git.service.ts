import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { simpleGit, SimpleGit, LogResult } from 'simple-git';
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
    return simpleGit(repoPath);
  }

  async initRepository(
    ownerName: string,
    repoSlug: string,
    defaultBranch: string = 'main',
    initReadme: boolean = false,
  ): Promise<string> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);

    if (fs.existsSync(repoPath)) {
      throw new InternalServerErrorException('Repository already exists on disk');
    }

    fs.mkdirSync(repoPath, { recursive: true });

    const git = this.getGit(repoPath);
    await git.init();
    await git.addConfig('init.defaultBranch', defaultBranch);
    await git.checkout(['-b', defaultBranch]);

    if (initReadme) {
      const readmePath = path.join(repoPath, 'README.md');
      fs.writeFileSync(readmePath, `# ${repoSlug}\n`);
      await git.add('.');
      await git.commit('Initial commit', { '--allow-empty': null });
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
      const result = await git.raw(['ls-tree', '--name-only', treeRef]);

      if (!result.trim()) return [];

      const entries: GitFileTreeEntry[] = [];
      const names = result.trim().split('\n');

      for (const name of names) {
        const fullPath = dirPath ? `${dirPath}/${name}` : name;
        const typeResult = await git.raw(['cat-file', '-t', `${branch}:${fullPath}`]);
        entries.push({
          name,
          path: fullPath,
          type: typeResult.trim() === 'tree' ? 'directory' : 'file',
        });
      }

      return entries;
    } catch {
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
      const log: LogResult = await git.log({
        [branch]: null,
        maxCount: limit,
        '--skip': offset,
      } as Record<string, unknown>);

      return log.all.map((entry) => ({
        sha: entry.hash,
        message: entry.message,
        author: entry.author_name,
        authorEmail: entry.author_email,
        date: entry.date,
        body: entry.body,
      }));
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
      const log = await git.log({ [sha]: null, maxCount: 1 } as Record<string, unknown>);
      const entry = log.latest;
      if (!entry) return null;

      return {
        sha: entry.hash,
        message: entry.message,
        author: entry.author_name,
        authorEmail: entry.author_email,
        date: entry.date,
        body: entry.body,
      };
    } catch {
      return null;
    }
  }

  async getCommitDiff(ownerName: string, repoSlug: string, sha: string): Promise<string> {
    const repoPath = this.getRepoPath(ownerName, repoSlug);
    const git = this.getGit(repoPath);
    return git.diff([`${sha}~1`, sha]);
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
}
