import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { PrismaClient, RepoVisibility } from '@prisma/client';

const execFileAsync = promisify(execFile);
const logger = new Logger('GitHttp');

// Flush packet sent between the service header and the refs advertisement
const FLUSH_PKT = Buffer.from('0000', 'ascii');

// Shared Prisma instance for the middleware (outside NestJS DI scope)
let prisma: PrismaClient;
function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Extract HTTP Basic Auth credentials from the request.
 * Git clients send credentials as Basic Auth when using HTTPS.
 */
function extractBasicAuth(req: Request): { username: string; password: string } | null {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Basic ')) return null;

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) return null;

  return {
    username: decoded.slice(0, colonIdx),
    password: decoded.slice(colonIdx + 1),
  };
}

/**
 * Validate a Personal Access Token and return the user ID.
 */
async function validatePat(token: string): Promise<string | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const db = getPrisma();

  const pat = await db.personalAccessToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, revokedAt: true, expiresAt: true },
  });

  if (!pat) return null;
  if (pat.revokedAt) return null;
  if (pat.expiresAt && pat.expiresAt < new Date()) return null;

  // Update lastUsedAt (fire-and-forget)
  db.personalAccessToken
    .update({ where: { id: pat.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return pat.userId;
}

/**
 * Check if a user has access to a repository.
 * For read (clone/fetch): public repos are open to all, private repos need auth.
 * For write (push): always requires auth + write permission.
 */
async function checkRepoAccess(
  owner: string,
  repo: string,
  userId: string | null,
  needsWrite: boolean,
): Promise<boolean> {
  const db = getPrisma();

  const repository = await db.repository.findFirst({
    where: {
      slug: repo,
      OR: [{ ownerUser: { username: owner } }, { ownerOrg: { name: owner } }],
    },
    select: {
      id: true,
      visibility: true,
      ownerUserId: true,
      ownerOrgId: true,
      isArchived: true,
    },
  });

  if (!repository) return false;

  // Read access for public repos
  if (!needsWrite && repository.visibility === RepoVisibility.PUBLIC) return true;

  // All remaining checks require authentication
  if (!userId) return false;

  // Block pushes to archived repos
  if (needsWrite && repository.isArchived) return false;

  // Owner has full access
  if (repository.ownerUserId === userId) return true;

  // Check explicit repository membership
  const member = await db.repositoryMember.findFirst({
    where: { repositoryId: repository.id, userId },
  });
  if (member) {
    if (!needsWrite) return true;
    return ['ADMIN', 'MAINTAINER', 'WRITE'].includes(member.role);
  }

  // Check organization membership
  if (repository.ownerOrgId) {
    const orgMember = await db.organizationMember.findFirst({
      where: { orgId: repository.ownerOrgId, userId },
    });
    if (orgMember) {
      if (!needsWrite) return true;
      return ['OWNER', 'ADMIN'].includes(orgMember.role);
    }
  }

  return false;
}

/** Send a 401 response prompting Git to ask for credentials. */
function sendAuthRequired(res: Response): void {
  res.setHeader('WWW-Authenticate', 'Basic realm="SpectraGit"');
  res.status(401).end('Authentication required');
}

/**
 * After a successful push, reconcile the on-disk branch state with the DB.
 * Also records an activity event for the push.
 */
async function onPostReceive(
  storagePath: string,
  owner: string,
  repo: string,
  userId: string,
): Promise<void> {
  try {
    const db = getPrisma();
    const repoPath = path.join(storagePath, owner, `${repo}.git`);

    // Find the repository
    const repository = await db.repository.findFirst({
      where: {
        slug: repo,
        OR: [{ ownerUser: { username: owner } }, { ownerOrg: { name: owner } }],
      },
      select: { id: true },
    });
    if (!repository) return;

    // Get all branches from disk
    const { stdout } = await execFileAsync(
      'git',
      ['for-each-ref', '--format=%(refname:short) %(objectname)', 'refs/heads/'],
      { cwd: repoPath },
    );

    const diskBranches = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, sha] = line.split(' ');
        return { name, sha };
      });

    // Get existing DB branches
    const dbBranches = await db.branch.findMany({
      where: { repositoryId: repository.id },
      select: { id: true, name: true, headCommitSha: true },
    });
    const dbMap = new Map(dbBranches.map((b) => [b.name, b]));

    // Upsert branches
    for (const disk of diskBranches) {
      const existing = dbMap.get(disk.name);
      if (existing) {
        if (existing.headCommitSha !== disk.sha) {
          await db.branch.update({
            where: { id: existing.id },
            data: { headCommitSha: disk.sha },
          });
        }
        dbMap.delete(disk.name);
      } else {
        await db.branch.create({
          data: {
            repositoryId: repository.id,
            name: disk.name,
            headCommitSha: disk.sha,
          },
        });
      }
    }

    // Remove branches deleted from disk
    for (const [, stale] of dbMap) {
      await db.branch.delete({ where: { id: stale.id } }).catch(() => {});
    }

    // Record activity event for the push
    await db.activityEvent.create({
      data: {
        repositoryId: repository.id,
        actorId: userId,
        type: 'PUSH',
        ref: diskBranches[0]?.name,
        afterSha: diskBranches[0]?.sha,
        metadata: {
          branchCount: diskBranches.length,
          owner,
          repo,
        },
      },
    });

    // Touch the repo's updatedAt
    await db.repository.update({
      where: { id: repository.id },
      data: { updatedAt: new Date() },
    });

    logger.log(`Post-receive sync completed for ${owner}/${repo}`);
  } catch (err) {
    logger.error(`Post-receive sync failed for ${owner}/${repo}: ${(err as Error).message}`);
  }
}

/**
 * Git Smart HTTP protocol middleware.
 *
 * Implements the Git Smart HTTP protocol with authentication via
 * Personal Access Tokens (PAT) over HTTP Basic Auth.
 *
 * Handles:
 *   GET  /:owner/:repo.git/info/refs?service=git-upload-pack   (clone/fetch)
 *   POST /:owner/:repo.git/git-upload-pack                     (clone/fetch)
 *   POST /:owner/:repo.git/git-receive-pack                    (push)
 *   GET  /:owner/:repo.git/HEAD                                (dumb HTTP fallback)
 *
 * Authentication:
 *   - Public repos allow anonymous clone/fetch
 *   - Private repos require HTTP Basic Auth with PAT
 *   - All push operations require HTTP Basic Auth with PAT
 *   - Username can be anything; password must be a valid PAT (sgit_...)
 */
export function createGitHttpMiddleware(storagePath: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Match paths like /:owner/:repo.git[/suffix]
    const match = req.path.match(/^\/([^/]+)\/([^/]+?)\.git(\/.*)?$/);
    if (!match) {
      next();
      return;
    }

    const [, owner, repo, suffix = ''] = match;
    const repoPath = path.join(storagePath, owner, `${repo}.git`);

    if (!fs.existsSync(repoPath)) {
      res.status(404).end('Repository not found');
      return;
    }

    logger.debug(`Git ${req.method} /${owner}/${repo}.git${suffix}`);

    // Determine if this is a write (push) operation
    const service = req.query['service'] as string | undefined;
    const isWrite =
      suffix === '/git-receive-pack' || (suffix === '/info/refs' && service === 'git-receive-pack');

    // Authenticate via HTTP Basic Auth (username ignored, password = PAT)
    let userId: string | null = null;
    const creds = extractBasicAuth(req);
    if (creds) {
      userId = await validatePat(creds.password);
    }

    // Authorization check
    const hasAccess = await checkRepoAccess(owner, repo, userId, isWrite);
    if (!hasAccess) {
      if (!creds) {
        // No credentials provided — ask Git client for them
        sendAuthRequired(res);
      } else {
        // Bad credentials or insufficient permissions
        res.status(403).end('Access denied');
      }
      return;
    }

    // ─── Route to handlers ────────────────────────────────────

    // GET /info/refs?service=git-upload-pack | git-receive-pack
    if (suffix === '/info/refs' && req.method === 'GET') {
      if (service !== 'git-upload-pack' && service !== 'git-receive-pack') {
        res.status(403).end('Unsupported service');
        return;
      }
      serveInfoRefs(repoPath, service, res);
      return;
    }

    // POST /git-upload-pack  (clone / fetch)
    if (suffix === '/git-upload-pack' && req.method === 'POST') {
      serveStatelessRpc('upload-pack', repoPath, req, res);
      return;
    }

    // POST /git-receive-pack  (push)
    if (suffix === '/git-receive-pack' && req.method === 'POST') {
      serveStatelessRpc('receive-pack', repoPath, req, res, () => {
        // Post-receive hook: reconcile DB state after push completes
        if (userId) {
          onPostReceive(storagePath, owner, repo, userId).catch(() => {});
        }
      });
      return;
    }

    // GET /HEAD  (dumb HTTP protocol fallback for some clients)
    if (suffix === '/HEAD' && req.method === 'GET') {
      const headPath = path.join(repoPath, 'HEAD');
      if (fs.existsSync(headPath)) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(headPath).pipe(res);
        return;
      }
      // Try .git/HEAD for non-bare repos
      const innerHead = path.join(repoPath, '.git', 'HEAD');
      if (fs.existsSync(innerHead)) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(innerHead).pipe(res);
        return;
      }
      res.status(404).end('Not found');
      return;
    }

    res.status(404).end('Not found');
  };
}

/**
 * Serve the "smart" refs advertisement for the given service.
 */
function serveInfoRefs(
  repoPath: string,
  service: 'git-upload-pack' | 'git-receive-pack',
  res: Response,
): void {
  const cmd = service === 'git-upload-pack' ? 'upload-pack' : 'receive-pack';

  const proc = spawn('git', [cmd, '--stateless-rpc', '--advertise-refs', repoPath], {
    env: { ...process.env },
  });

  const chunks: Buffer[] = [];
  proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));

  proc.stderr.on('data', (d: Buffer) =>
    logger.warn(`git ${cmd} advertise: ${d.toString().trimEnd()}`),
  );

  proc.on('error', (err) => {
    logger.error(`git ${cmd} spawn error: ${err.message}`);
    if (!res.headersSent) res.status(500).end('Git backend error');
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      if (!res.headersSent) res.status(500).end('Git backend error');
      return;
    }

    const refsBody = Buffer.concat(chunks);
    const serviceHeader = pktLine(`# service=${service}\n`);

    res.status(200);
    res.setHeader('Content-Type', `application/x-${service}-advertisement`);
    res.setHeader('Cache-Control', 'no-cache');
    res.write(serviceHeader);
    res.write(FLUSH_PKT);
    res.write(refsBody);
    res.end();
  });

  proc.stdin.end();
}

/**
 * Serve a stateless-rpc session (upload-pack for clone/fetch,
 * receive-pack for push).  The request body is piped directly to the
 * git process and the output is streamed back to the client.
 *
 * An optional onComplete callback is called after the git process exits
 * successfully (used for post-receive hooks).
 */
function serveStatelessRpc(
  cmd: 'upload-pack' | 'receive-pack',
  repoPath: string,
  req: Request,
  res: Response,
  onComplete?: () => void,
): void {
  const proc = spawn('git', [cmd, '--stateless-rpc', repoPath], {
    env: { ...process.env },
  });

  res.setHeader('Content-Type', `application/x-git-${cmd}-result`);
  res.setHeader('Cache-Control', 'no-cache');

  req.pipe(proc.stdin);
  proc.stdin.on('error', () => {}); // ignore EPIPE

  proc.stdout.pipe(res);

  proc.stderr.on('data', (d: Buffer) => logger.warn(`git ${cmd}: ${d.toString().trimEnd()}`));

  proc.on('error', (err) => {
    logger.error(`git ${cmd} spawn error: ${err.message}`);
    if (!res.headersSent) res.status(500).end('Git backend error');
  });

  proc.on('close', (code) => {
    if (code === 0 && onComplete) {
      onComplete();
    }
  });
}

/** Encode a string as a single pkt-line (4-byte hex length prefix + data). */
function pktLine(data: string): Buffer {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length + 4; // 4 bytes for the length field itself
  const header = Buffer.from(len.toString(16).padStart(4, '0'), 'ascii');
  return Buffer.concat([header, payload]);
}
