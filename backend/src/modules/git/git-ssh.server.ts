import { Logger } from '@nestjs/common';
import { spawn, execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient, RepoVisibility } from '@prisma/client';

// ssh2 types
import type {
  Server as SSH2Server,
  ServerConfig,
  Connection,
  Session as SSH2Session,
  AuthContext,
  PublicKeyAuthContext,
  ExecInfo,
} from 'ssh2';

const execFileAsync = promisify(execFile);
const logger = new Logger('GitSSH');

// Shared Prisma instance for the SSH server (outside NestJS DI scope, same
// pattern used by the HTTP middleware).
let prisma: PrismaClient;
function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// ─── Auth helpers (mirrors git-http.middleware logic) ──────────────

interface SSHKeyRecord {
  userId: string;
  publicKey: string;
}

/**
 * Look up an SSH public key by its SHA-256 fingerprint.
 * Returns the userId and stored public key string, or null if not found.
 */
async function lookupPublicKey(
  keyData: Buffer,
): Promise<SSHKeyRecord | null> {
  const fingerprint = createHash('sha256').update(keyData).digest('hex');
  const db = getPrisma();

  const sshKey = await db.sSHKey.findUnique({
    where: { fingerprint },
    select: { id: true, userId: true, publicKey: true },
  });

  if (!sshKey) return null;

  // Update lastUsedAt (fire-and-forget)
  db.sSHKey
    .update({ where: { id: sshKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { userId: sshKey.userId, publicKey: sshKey.publicKey };
}

/**
 * Check if a user has access to a repository (same logic as HTTP middleware).
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

/**
 * After a successful push, reconcile the on-disk branch state with the DB
 * and record an activity event.  Same logic as HTTP post-receive.
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

    const repository = await db.repository.findFirst({
      where: {
        slug: repo,
        OR: [{ ownerUser: { username: owner } }, { ownerOrg: { name: owner } }],
      },
      select: { id: true },
    });
    if (!repository) return;

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

    const dbBranches = await db.branch.findMany({
      where: { repositoryId: repository.id },
      select: { id: true, name: true, headCommitSha: true },
    });
    const dbMap = new Map(dbBranches.map((b) => [b.name, b]));

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

    for (const [, stale] of dbMap) {
      await db.branch.delete({ where: { id: stale.id } }).catch(() => {});
    }

    await db.activityEvent.create({
      data: {
        repositoryId: repository.id,
        actorId: userId,
        type: 'PUSH',
        ref: diskBranches[0]?.name,
        afterSha: diskBranches[0]?.sha,
        metadata: { branchCount: diskBranches.length, owner, repo },
      },
    });

    await db.repository.update({
      where: { id: repository.id },
      data: { updatedAt: new Date() },
    });

    logger.log(`Post-receive sync completed for ${owner}/${repo}`);
  } catch (err) {
    logger.error(
      `Post-receive sync failed for ${owner}/${repo}: ${(err as Error).message}`,
    );
  }
}

// ─── Host key management ──────────────────────────────────────

/**
 * Read or generate an SSH host key pair. The key is persisted at
 * `<storagePath>/.ssh/host_key` so it survives container restarts
 * (the storage path is on a Docker volume).
 *
 * Uses ssh-keygen to produce an OpenSSH-format key that the ssh2
 * library can parse natively.
 */
function getOrCreateHostKey(storagePath: string): Buffer {
  const sshDir = path.join(storagePath, '.ssh');
  const keyPath = path.join(sshDir, 'host_key');

  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }

  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { recursive: true });
  }

  // Use ssh-keygen to generate an ed25519 key in OpenSSH format
  execFileSync('ssh-keygen', [
    '-t', 'ed25519',
    '-f', keyPath,
    '-N', '',    // empty passphrase
    '-q',        // quiet
  ]);

  // Remove the .pub file — we only need the private key
  const pubPath = `${keyPath}.pub`;
  if (fs.existsSync(pubPath)) {
    fs.unlinkSync(pubPath);
  }

  fs.chmodSync(keyPath, 0o600);
  logger.log('Generated new SSH host key');
  return fs.readFileSync(keyPath);
}

// ─── Command parsing ──────────────────────────────────────────

interface ParsedGitCommand {
  /** git subcommand: 'upload-pack' or 'receive-pack' */
  cmd: 'upload-pack' | 'receive-pack';
  /** repository owner */
  owner: string;
  /** repository slug (without .git suffix) */
  repo: string;
}

/**
 * Parse the SSH exec command into owner/repo and git command.
 *
 * Git clients send commands like:
 *   git-upload-pack '/owner/repo.git'
 *   git-receive-pack '/owner/repo.git'
 */
function parseGitCommand(command: string): ParsedGitCommand | null {
  const match = command.match(
    /^git[-\s](upload-pack|receive-pack)\s+'?\/?([^/]+)\/([^/]+?)(?:\.git)?'?$/,
  );
  if (!match) return null;

  return {
    cmd: match[1] as 'upload-pack' | 'receive-pack',
    owner: match[2],
    repo: match[3],
  };
}

// ─── SSH Server ───────────────────────────────────────────────

/**
 * Create and start the SSH server for git operations.
 *
 * Uses the ssh2 library to implement the SSH transport layer.
 * Public key authentication is verified against the SSHKey table.
 */
export async function startGitSSHServer(
  storagePath: string,
  port: number,
): Promise<net.Server> {
  // Dynamic import of ssh2 (has native bindings)
  const ssh2Module = await import('ssh2');
  const Server = ssh2Module.Server;
  // ssh2 exports utils at runtime (types don't always expose it as top-level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sshUtils = (ssh2Module as any).utils ?? ssh2Module;

  const hostKey = getOrCreateHostKey(storagePath);

  const server = new Server(
    { hostKeys: [hostKey] },
    (client: Connection) => {
      let authenticatedUserId: string | null = null;

      client.on('authentication', (ctx: AuthContext) => {
        if (ctx.method === 'publickey') {
          const pkCtx = ctx as PublicKeyAuthContext;
          const keyData = pkCtx.key.data;

          if (!pkCtx.signature) {
            // ── Phase 1: key query ─────────────────────────────────────────
            // The client is checking whether this key is acceptable before
            // sending the signed request.  We only confirm it's registered;
            // no authentication happens yet.
            lookupPublicKey(keyData)
              .then((record) => {
                if (record) ctx.accept();
                else ctx.reject(['publickey']);
              })
              .catch(() => ctx.reject(['publickey']));
            return;
          }

          // ── Phase 2: signed auth ───────────────────────────────────────
          // The client sent a proper signed request.  We must:
          //   1. Confirm the key is registered in the DB.
          //   2. Cryptographically verify the signature to prevent replay /
          //      impersonation attacks.
          lookupPublicKey(keyData)
            .then((record) => {
              if (!record) {
                ctx.reject(['publickey']);
                return;
              }

              // Parse the stored public key and verify the signature
              const parsedKey = (sshUtils as any).parseKey(record.publicKey);
              if (!parsedKey || parsedKey instanceof Error) {
                logger.error('Failed to parse stored SSH public key');
                ctx.reject(['publickey']);
                return;
              }

              const verified = parsedKey.verify(
                pkCtx.blob as Buffer,
                pkCtx.signature as Buffer,
                pkCtx.hashAlgo as string,
              );

              if (verified !== true) {
                logger.warn('SSH signature verification failed');
                ctx.reject(['publickey']);
                return;
              }

              authenticatedUserId = record.userId;
              ctx.accept();
            })
            .catch(() => ctx.reject(['publickey']));
        } else {
          // Reject password, keyboard-interactive, etc.
          ctx.reject(['publickey']);
        }
      });

      client.on('ready', () => {
        logger.debug(`SSH client authenticated (userId=${authenticatedUserId})`);

        client.on('session', (accept: () => SSH2Session) => {
          const session = accept();

          session.on('exec', (accept: (rejectOrAccept?: boolean) => any, reject: () => void, info: ExecInfo) => {
            const command = info.command;
            logger.debug(`SSH exec: ${command}`);

            const parsed = parseGitCommand(command);
            if (!parsed) {
              const channel = accept();
              channel.stderr.write('Invalid git command\n');
              channel.exit(1);
              channel.close();
              return;
            }

            const { cmd, owner, repo } = parsed;
            const repoPath = path.join(storagePath, owner, `${repo}.git`);
            const needsWrite = cmd === 'receive-pack';

            if (!fs.existsSync(repoPath)) {
              const channel = accept();
              channel.stderr.write(
                `ERROR: Repository '${owner}/${repo}' not found.\n`,
              );
              channel.exit(128);
              channel.close();
              return;
            }

            // Check authorization
            checkRepoAccess(owner, repo, authenticatedUserId, needsWrite)
              .then((hasAccess) => {
                if (!hasAccess) {
                  const channel = accept();
                  channel.stderr.write(
                    `ERROR: Permission denied to '${owner}/${repo}'.\n`,
                  );
                  channel.exit(128);
                  channel.close();
                  return;
                }

                const channel = accept();

                // Spawn the git process
                const proc = spawn('git', [cmd, repoPath], {
                  env: { ...process.env },
                });

                // stdin: channel (client) → git
                channel.pipe(proc.stdin);
                proc.stdin.on('error', () => {}); // ignore EPIPE

                // stdout: git → channel.
                // { end: false } prevents the automatic channel.end() that
                // pipe() would trigger when proc.stdout closes.  We must
                // send the exit status BEFORE ending the channel, otherwise
                // git clients see "fatal: remote transport reported error".
                proc.stdout.pipe(channel, { end: false });

                // stderr: git → channel.stderr
                proc.stderr.pipe(channel.stderr, { end: false });

                proc.on('error', (err) => {
                  logger.error(`git ${cmd} spawn error: ${err.message}`);
                  channel.stderr.write('Internal server error\n');
                  channel.exit(128);
                  channel.end();
                });

                proc.on('close', (code) => {
                  // Send exit status first, then EOF — order matters
                  channel.exit(code ?? 1);
                  channel.end();

                  // Post-receive hook for push
                  if (code === 0 && cmd === 'receive-pack' && authenticatedUserId) {
                    onPostReceive(storagePath, owner, repo, authenticatedUserId).catch(
                      () => {},
                    );
                  }
                });

                // When channel closes (client disconnected), kill the git process
                channel.on('close', () => {
                  if (!proc.killed) proc.kill();
                });
              })
              .catch((err) => {
                logger.error(`SSH auth check error: ${(err as Error).message}`);
                const channel = accept();
                channel.stderr.write('Internal server error\n');
                channel.exit(128);
                channel.close();
              });
          });
        });
      });

      client.on('error', (err) => {
        // Client-level errors (e.g. protocol issues) — log and ignore
        logger.debug(`SSH client error: ${err.message}`);
      });
    },
  );

  return new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      logger.log(`Git SSH server listening on port ${port}`);
      resolve(server as unknown as net.Server);
    });

    server.on('error', (err: Error) => {
      logger.error(`SSH server error: ${err.message}`);
      reject(err);
    });
  });
}
