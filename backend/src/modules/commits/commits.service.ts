import { Injectable } from '@nestjs/common';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommitsService {
  constructor(
    private readonly gitService: GitService,
    private readonly reposService: RepositoriesService,
    private readonly prisma: PrismaService,
  ) {}

  /** Resolve a map of email -> avatarUrl for the given set of author emails. */
  private async resolveAvatars(emails: string[]): Promise<Map<string, string | null>> {
    const unique = [...new Set(emails)].filter(Boolean);
    if (unique.length === 0) return new Map();
    const users = await this.prisma.user.findMany({
      where: { email: { in: unique } },
      select: { email: true, avatarUrl: true },
    });
    const map = new Map<string, string | null>();
    for (const u of users) map.set(u.email, u.avatarUrl ?? null);
    return map;
  }

  async getCommitsByBranch(
    owner: string,
    repo: string,
    branch: string,
    limit: number = 30,
    offset: number = 0,
    userId?: string,
  ) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const [commits, total] = await Promise.all([
      this.gitService.getCommitLog(owner, repo, branch, limit, offset),
      this.gitService.getCommitCount(owner, repo, branch),
    ]);
    const avatarMap = await this.resolveAvatars(commits.map((c) => c.authorEmail));
    const data = commits.map((c) => ({ ...c, authorAvatarUrl: avatarMap.get(c.authorEmail) ?? null }));
    return { data, total };
  }

  async getCommitDetail(owner: string, repo: string, sha: string, userId?: string) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.gitService.getCommitDetail(owner, repo, sha);
  }

  async getCommitDiff(owner: string, repo: string, sha: string, userId?: string) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.gitService.getCommitDiff(owner, repo, sha);
  }

  async compareBranches(owner: string, repo: string, base: string, head: string, userId?: string) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const diff = await this.gitService.getDiffBetween(owner, repo, base, head);
    return { base, head, diff };
  }
}
