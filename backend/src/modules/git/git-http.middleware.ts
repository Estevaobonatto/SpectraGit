import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const logger = new Logger('GitHttp');

// Flush packet sent between the service header and the refs advertisement
const FLUSH_PKT = Buffer.from('0000', 'ascii');

/**
 * Git Smart HTTP protocol middleware.
 *
 * Bypasses `git http-backend` (not included in Alpine's git package) and
 * calls `git upload-pack` / `git receive-pack` directly using their
 * `--stateless-rpc` flag, which is the standard way to serve Git over HTTP.
 *
 * Handles:
 *   GET  /:owner/:repo.git/info/refs?service=git-upload-pack   (clone/fetch discovery)
 *   POST /:owner/:repo.git/git-upload-pack                     (clone/fetch pack data)
 *   POST /:owner/:repo.git/git-receive-pack                    (push)
 *
 * Works with both **bare** repos and **non-bare** repos (where the git data
 * sits in an inner `.git/` directory), because `git upload-pack` resolves
 * the git directory itself.
 *
 * Authentication/authorization is NOT enforced — add a layer on top for
 * private-repository access control when needed.
 */
export function createGitHttpMiddleware(storagePath: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    // GET /info/refs?service=git-upload-pack | git-receive-pack
    if (suffix === '/info/refs' && req.method === 'GET') {
      const service = req.query['service'] as string;
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
      serveStatelessRpc('receive-pack', repoPath, req, res);
      return;
    }

    res.status(404).end('Not found');
  };
}

/**
 * Serve the "smart" refs advertisement for the given service.
 * The response body begins with a pkt-line service header, a flush packet,
 * then the raw output from `git <cmd> --stateless-rpc --advertise-refs`.
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
 */
function serveStatelessRpc(
  cmd: 'upload-pack' | 'receive-pack',
  repoPath: string,
  req: Request,
  res: Response,
): void {
  const proc = spawn('git', [cmd, '--stateless-rpc', repoPath], {
    env: { ...process.env },
  });

  res.setHeader('Content-Type', `application/x-git-${cmd}-result`);
  res.setHeader('Cache-Control', 'no-cache');

  req.pipe(proc.stdin);
  proc.stdin.on('error', () => {}); // ignore EPIPE

  proc.stdout.pipe(res);

  proc.stderr.on('data', (d: Buffer) =>
    logger.warn(`git ${cmd}: ${d.toString().trimEnd()}`),
  );

  proc.on('error', (err) => {
    logger.error(`git ${cmd} spawn error: ${err.message}`);
    if (!res.headersSent) res.status(500).end('Git backend error');
  });
}

/** Encode a string as a single pkt-line (4-byte hex length prefix + data). */
function pktLine(data: string): Buffer {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length + 4; // 4 bytes for the length field itself
  const header = Buffer.from(len.toString(16).padStart(4, '0'), 'ascii');
  return Buffer.concat([header, payload]);
}
