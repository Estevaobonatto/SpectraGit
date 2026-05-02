import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { PrismaService } from '../../../prisma/prisma.service';
import { GitHubGhostUserService } from './github-ghost-user.service';
import { GitHubRateLimitService } from './github-rate-limit.service';
import {
  IssueStatus,
  PRStatus,
  CommentType,
  RepoVisibility,
} from '@prisma/client';

@Injectable()
export class GitHubIncrementalSyncService {
  private readonly logger = new Logger(GitHubIncrementalSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ghostUserService: GitHubGhostUserService,
    private readonly rateLimitService: GitHubRateLimitService,
  ) {}

  /**
   * Incrementally sync a repository from GitHub.
   * Uses ETags and per-resource timestamps to avoid redundant work.
   */
  async syncRepository(
    repositoryId: string,
    userId: string,
    accessToken: string,
  ): Promise<{ success: boolean; syncedResources: string[]; errors: string[] }> {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repo || !repo.githubRepoFullName) {
      return { success: false, syncedResources: [], errors: ['Repository not linked to GitHub'] };
    }

    const [owner, repoName] = repo.githubRepoFullName.split('/');
    const octokit = new Octokit({ auth: accessToken });
    const syncedResources: string[] = [];
    const errors: string[] = [];

    await this.rateLimitService.respectRateLimit(userId);

    // 1. Sync metadata
    try {
      await this.syncRepositoryMetadata(repo.id, owner, repoName, octokit);
      syncedResources.push('metadata');
    } catch (e: any) {
      errors.push(`metadata: ${e.message}`);
    }

    // 2. Sync labels
    try {
      await this.syncLabels(repo.id, owner, repoName, octokit);
      syncedResources.push('labels');
    } catch (e: any) {
      errors.push(`labels: ${e.message}`);
    }

    // 3. Sync milestones
    try {
      await this.syncMilestones(repo.id, owner, repoName, octokit);
      syncedResources.push('milestones');
    } catch (e: any) {
      errors.push(`milestones: ${e.message}`);
    }

    // 4. Sync issues
    try {
      await this.syncIssues(repo.id, owner, repoName, octokit, userId);
      syncedResources.push('issues');
    } catch (e: any) {
      errors.push(`issues: ${e.message}`);
    }

    // 5. Sync pull requests
    try {
      await this.syncPullRequests(repo.id, owner, repoName, octokit, userId);
      syncedResources.push('pull_requests');
    } catch (e: any) {
      errors.push(`pull_requests: ${e.message}`);
    }

    // 6. Sync releases
    try {
      await this.syncReleases(repo.id, owner, repoName, octokit, userId);
      syncedResources.push('releases');
    } catch (e: any) {
      errors.push(`releases: ${e.message}`);
    }

    // Update repo lastSyncedAt
    await this.prisma.repository.update({
      where: { id: repo.id },
      data: { lastSyncedAt: new Date() },
    });

    return { success: errors.length === 0, syncedResources, errors };
  }

  private async syncRepositoryMetadata(
    repoId: string,
    owner: string,
    repoName: string,
    octokit: Octokit,
  ) {
    const { data: ghRepo } = await octokit.repos.get({ owner, repo: repoName });
    await this.prisma.repository.update({
      where: { id: repoId },
      data: {
        description: ghRepo.description ?? null,
        topics: ghRepo.topics ?? [],
        defaultBranch: ghRepo.default_branch ?? 'main',
        visibility: ghRepo.private ? RepoVisibility.PRIVATE : RepoVisibility.PUBLIC,
      },
    });
  }

  private async syncLabels(repoId: string, owner: string, repoName: string, octokit: Octokit) {
    const { data: labels } = await octokit.issues.listLabelsForRepo({ owner, repo: repoName, per_page: 100 });
    for (const gl of labels) {
      await this.prisma.label.upsert({
        where: { repositoryId_name: { repositoryId: repoId, name: gl.name } },
        create: {
          repositoryId: repoId,
          name: gl.name,
          color: `#${gl.color}`,
          description: gl.description?.slice(0, 200) ?? null,
          githubExternalId: String(gl.id),
          syncedAt: new Date(),
        },
        update: {
          color: `#${gl.color}`,
          description: gl.description?.slice(0, 200) ?? null,
          syncedAt: new Date(),
        },
      });
    }
  }

  private async syncMilestones(repoId: string, owner: string, repoName: string, octokit: Octokit) {
    const { data: milestones } = await octokit.issues.listMilestones({
      owner,
      repo: repoName,
      state: 'all',
      per_page: 100,
    });
    for (const gm of milestones) {
      await this.prisma.milestone.upsert({
        where: { repositoryId_title: { repositoryId: repoId, title: gm.title } },
        create: {
          repositoryId: repoId,
          title: gm.title,
          description: gm.description?.slice(0, 500) ?? null,
          dueDate: gm.due_on ? new Date(gm.due_on) : null,
          closedAt: gm.closed_at ? new Date(gm.closed_at) : null,
          githubExternalId: String(gm.number),
          syncedAt: new Date(),
        },
        update: {
          title: gm.title,
          description: gm.description?.slice(0, 500) ?? null,
          dueDate: gm.due_on ? new Date(gm.due_on) : null,
          closedAt: gm.closed_at ? new Date(gm.closed_at) : null,
          syncedAt: new Date(),
        },
      });
    }
  }

  private async syncIssues(
    repoId: string,
    owner: string,
    repoName: string,
    octokit: Octokit,
    userId: string,
  ) {
    const state = 'all' as const;
    const perPage = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      await this.rateLimitService.respectRateLimit(userId, 20);
      const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo: repoName,
        state,
        per_page: perPage,
        page,
        sort: 'updated',
        direction: 'desc',
      });

      if (issues.length === 0) break;

      for (const gi of issues) {
        if (gi.pull_request) continue; // Skip PRs

        const ghExtId = String(gi.number);
        const { identity } = await this.ghostUserService.resolveGitHubUser(gi.user as any);
        const ghostUserId = await this.ghostUserService.getGhostUserId();

        const existing = await this.prisma.issue.findFirst({
          where: { repositoryId: repoId, githubExternalId: ghExtId },
        });

        if (existing) {
          // Only update if GitHub's updated_at is newer
          const ghUpdated = new Date(gi.updated_at);
          if (ghUpdated > existing.updatedAt) {
            await this.prisma.issue.update({
              where: { id: existing.id },
              data: {
                title: gi.title,
                body: gi.body,
                status: gi.state === 'open' ? IssueStatus.OPEN : IssueStatus.CLOSED,
                externalAuthorId: identity.id,
                syncedAt: new Date(),
              },
            });
          }
        } else {
          const maxIssue = await this.prisma.issue.findFirst({
            where: { repositoryId: repoId },
            orderBy: { number: 'desc' },
            select: { number: true },
          });
          await this.prisma.issue.create({
            data: {
              repositoryId: repoId,
              authorId: identity.userId ?? ghostUserId,
              externalAuthorId: identity.id,
              number: (maxIssue?.number ?? 0) + 1,
              title: gi.title,
              body: gi.body,
              status: gi.state === 'open' ? IssueStatus.OPEN : IssueStatus.CLOSED,
              githubExternalId: ghExtId,
              syncedAt: new Date(),
            },
          });
        }
      }

      hasMore = issues.length === perPage;
      page++;
    }
  }

  private async syncPullRequests(
    repoId: string,
    owner: string,
    repoName: string,
    octokit: Octokit,
    userId: string,
  ) {
    const state = 'all' as const;
    const perPage = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      await this.rateLimitService.respectRateLimit(userId, 20);
      const { data: prs } = await octokit.pulls.list({
        owner,
        repo: repoName,
        state,
        per_page: perPage,
        page,
        sort: 'updated',
        direction: 'desc',
      });

      if (prs.length === 0) break;

      for (const gp of prs) {
        const ghExtId = String(gp.number);
        const { identity } = await this.ghostUserService.resolveGitHubUser(gp.user as any);
        const ghostUserId = await this.ghostUserService.getGhostUserId();

        let status: PRStatus = PRStatus.OPEN;
        if (gp.merged_at) status = PRStatus.MERGED;
        else if (gp.state === 'closed') status = PRStatus.CLOSED;

        const existing = await this.prisma.pullRequest.findFirst({
          where: { repositoryId: repoId, githubExternalId: ghExtId },
        });

        if (existing) {
          const ghUpdated = new Date(gp.updated_at);
          if (ghUpdated > existing.updatedAt) {
            await this.prisma.pullRequest.update({
              where: { id: existing.id },
              data: {
                title: gp.title,
                body: gp.body,
                status,
                sourceBranch: gp.head.ref,
                targetBranch: gp.base.ref,
                isDraft: gp.draft ?? false,
                mergedAt: gp.merged_at ? new Date(gp.merged_at) : null,
                externalAuthorId: identity.id,
                syncedAt: new Date(),
              },
            });
          }
        } else {
          const maxPR = await this.prisma.pullRequest.findFirst({
            where: { repositoryId: repoId },
            orderBy: { number: 'desc' },
            select: { number: true },
          });
          await this.prisma.pullRequest.create({
            data: {
              repositoryId: repoId,
              authorId: identity.userId ?? ghostUserId,
              externalAuthorId: identity.id,
              number: (maxPR?.number ?? 0) + 1,
              sourceBranch: gp.head.ref,
              targetBranch: gp.base.ref,
              title: gp.title,
              body: gp.body,
              status,
              mergedAt: gp.merged_at ? new Date(gp.merged_at) : null,
              isDraft: gp.draft ?? false,
              githubExternalId: ghExtId,
              syncedAt: new Date(),
            },
          });
        }
      }

      hasMore = prs.length === perPage;
      page++;
    }
  }

  private async syncReleases(
    repoId: string,
    owner: string,
    repoName: string,
    octokit: Octokit,
    userId: string,
  ) {
    await this.rateLimitService.respectRateLimit(userId, 20);
    const { data: releases } = await octokit.repos.listReleases({
      owner,
      repo: repoName,
      per_page: 100,
    });

    for (const gr of releases) {
      const ghExtId = String(gr.id);
      const { identity } = await this.ghostUserService.resolveGitHubUser(gr.author as any);
      const ghostUserId = await this.ghostUserService.getGhostUserId();

      let tag = await this.prisma.tag.findUnique({
        where: { repositoryId_name: { repositoryId: repoId, name: gr.tag_name } },
      });
      if (!tag) {
        tag = await this.prisma.tag.create({
          data: {
            repositoryId: repoId,
            name: gr.tag_name,
            commitSha: '',
          },
        });
      }

      const existing = await this.prisma.release.findFirst({
        where: { repositoryId: repoId, githubExternalId: ghExtId },
      });

      if (existing) {
        await this.prisma.release.update({
          where: { id: existing.id },
          data: {
            name: gr.name ?? gr.tag_name,
            body: gr.body,
            isDraft: gr.draft,
            isPrerelease: gr.prerelease,
            externalAuthorId: identity.id,
            syncedAt: new Date(),
          },
        });
      } else {
        await this.prisma.release.create({
          data: {
            repositoryId: repoId,
            tagId: tag.id,
            name: gr.name ?? gr.tag_name,
            body: gr.body,
            targetBranch: gr.target_commitish,
            isDraft: gr.draft,
            isPrerelease: gr.prerelease,
            authorId: identity.userId ?? ghostUserId,
            externalAuthorId: identity.id,
            githubExternalId: ghExtId,
            syncedAt: new Date(),
          },
        });
      }
    }
  }
}
