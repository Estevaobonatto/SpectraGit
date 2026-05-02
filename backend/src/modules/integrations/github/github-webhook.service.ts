import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { GitHubGhostUserService, GitHubUserPayload } from './github-ghost-user.service';
import { GitHubRateLimitService } from './github-rate-limit.service';
import { Octokit } from '@octokit/rest';
import {
  IssueStatus,
  PRStatus,
  CommentType,
  ImportJobStatus,
} from '@prisma/client';

export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    id: number;
    full_name: string;
    name: string;
    owner: GitHubUserPayload;
  };
  issue?: {
    number: number;
    title: string;
    body: string | null;
    state: string;
    user: GitHubUserPayload;
    labels?: Array<{ name: string; color?: string }>;
    milestone?: { number: number; title: string } | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
  };
  pull_request?: {
    number: number;
    title: string;
    body: string | null;
    state: string;
    merged_at: string | null;
    user: GitHubUserPayload;
    head: { ref: string };
    base: { ref: string };
    labels?: Array<{ name: string; color?: string }>;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    draft?: boolean;
  };
  comment?: {
    id: number;
    body: string;
    user: GitHubUserPayload;
    created_at: string;
    updated_at: string;
  };
  release?: {
    id: number;
    tag_name: string;
    name: string;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    author: GitHubUserPayload;
    created_at: string;
    published_at: string | null;
    target_commitish: string;
  };
  label?: {
    name: string;
    color: string;
    description: string | null;
  };
  milestone?: {
    number: number;
    title: string;
    description: string | null;
    state: string;
    due_on: string | null;
    created_at: string;
    closed_at: string | null;
  };
  sender: GitHubUserPayload;
}

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ghostUserService: GitHubGhostUserService,
    private readonly rateLimitService: GitHubRateLimitService,
  ) {}

  /**
   * Verify webhook signature from GitHub.
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const digest = `sha256=${hmac.digest('hex')}`;
    return signature === digest;
  }

  /**
   * Process an incoming webhook event.
   */
  async processWebhook(
    eventType: string,
    deliveryId: string,
    payload: GitHubWebhookPayload,
    signature: string | undefined,
  ): Promise<{ processed: boolean; message?: string }> {
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      throw new BadRequestException('Missing repository in payload');
    }

    // Find the linked repository
    const repo = await this.prisma.repository.findFirst({
      where: { githubRepoFullName: repoFullName },
    });

    if (!repo) {
      this.logger.warn(`Webhook for unknown repo: ${repoFullName}`);
      return { processed: false, message: 'Repository not linked' };
    }

    // Verify signature if secret is configured
    if (repo.githubWebhookSecret && signature) {
      // Signature verification should happen at controller level with raw body
      // This is a secondary check placeholder
    }

    // Log the event
    await this.prisma.gitHubWebhookEvent.create({
      data: {
        repositoryId: repo.id,
        eventType,
        deliveryId,
        payload: payload as any,
        signature: signature ?? null,
        processed: false,
      },
    });

    try {
      switch (eventType) {
        case 'issues':
          await this.handleIssueEvent(repo.id, payload);
          break;
        case 'issue_comment':
          await this.handleIssueCommentEvent(repo.id, payload);
          break;
        case 'pull_request':
          await this.handlePullRequestEvent(repo.id, payload);
          break;
        case 'pull_request_review_comment':
        case 'issue_comment':
          await this.handleIssueCommentEvent(repo.id, payload);
          break;
        case 'release':
          await this.handleReleaseEvent(repo.id, payload);
          break;
        case 'label':
          await this.handleLabelEvent(repo.id, payload);
          break;
        case 'milestone':
          await this.handleMilestoneEvent(repo.id, payload);
          break;
        case 'push':
          await this.handlePushEvent(repo.id, payload);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${eventType}`);
          return { processed: false, message: 'Event type not handled' };
      }

      await this.prisma.gitHubWebhookEvent.updateMany({
        where: { deliveryId },
        data: { processed: true },
      });

      return { processed: true };
    } catch (error: any) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      await this.prisma.gitHubWebhookEvent.updateMany({
        where: { deliveryId },
        data: { processed: false, error: error.message?.slice(0, 2000) },
      });
      throw error;
    }
  }

  private async handleIssueEvent(repoId: string, payload: GitHubWebhookPayload) {
    const { action, issue } = payload;
    if (!issue) return;

    const ghExtId = String(issue.number);
    const existing = await this.prisma.issue.findFirst({
      where: { repositoryId: repoId, githubExternalId: ghExtId },
    });

    const { identity } = await this.ghostUserService.resolveGitHubUser(issue.user);
    const ghostUserId = await this.ghostUserService.getGhostUserId();

    if (action === 'opened' || action === 'reopened') {
      if (existing) {
        await this.prisma.issue.update({
          where: { id: existing.id },
          data: {
            title: issue.title,
            body: issue.body,
            status: IssueStatus.OPEN,
            externalAuthorId: identity.id,
            syncedAt: new Date(),
          },
        });
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
            title: issue.title,
            body: issue.body,
            status: IssueStatus.OPEN,
            githubExternalId: ghExtId,
            syncedAt: new Date(),
          },
        });
      }
    } else if (action === 'closed') {
      if (existing) {
        await this.prisma.issue.update({
          where: { id: existing.id },
          data: {
            status: IssueStatus.CLOSED,
            syncedAt: new Date(),
          },
        });
      }
    } else if (action === 'edited' && existing) {
      await this.prisma.issue.update({
        where: { id: existing.id },
        data: {
          title: issue.title,
          body: issue.body,
          syncedAt: new Date(),
        },
      });
    } else if (action === 'deleted' && existing) {
      await this.prisma.issue.delete({ where: { id: existing.id } }).catch(() => {});
    }
  }

  private async handleIssueCommentEvent(repoId: string, payload: GitHubWebhookPayload) {
    const { action, comment, issue, pull_request } = payload;
    if (!comment) return;

    const isPR = !!pull_request;
    const parentExtId = String((issue ?? pull_request)!.number);

    let parentId: string | null = null;
    if (isPR) {
      const pr = await this.prisma.pullRequest.findFirst({
        where: { repositoryId: repoId, githubExternalId: parentExtId },
      });
      parentId = pr?.id ?? null;
    } else {
      const iss = await this.prisma.issue.findFirst({
        where: { repositoryId: repoId, githubExternalId: parentExtId },
      });
      parentId = iss?.id ?? null;
    }

    if (!parentId) return;

    const commentExtId = String(comment.id);
    const existingComment = await this.prisma.comment.findFirst({
      where: { githubExternalId: commentExtId },
    });

    const { identity } = await this.ghostUserService.resolveGitHubUser(comment.user);
    const ghostUserId = await this.ghostUserService.getGhostUserId();

    if (action === 'created') {
      if (!existingComment) {
        await this.prisma.comment.create({
          data: {
            authorId: identity.userId ?? ghostUserId,
            externalAuthorId: identity.id,
            type: isPR ? CommentType.PULL_REQUEST : CommentType.ISSUE,
            issueId: isPR ? null : parentId,
            pullRequestId: isPR ? parentId : null,
            body: comment.body,
            githubExternalId: commentExtId,
            syncedAt: new Date(),
          },
        });
      }
    } else if (action === 'edited' && existingComment) {
      await this.prisma.comment.update({
        where: { id: existingComment.id },
        data: { body: comment.body, syncedAt: new Date() },
      });
    } else if (action === 'deleted' && existingComment) {
      await this.prisma.comment.delete({ where: { id: existingComment.id } }).catch(() => {});
    }
  }

  private async handlePullRequestEvent(repoId: string, payload: GitHubWebhookPayload) {
    const { action, pull_request: pr } = payload;
    if (!pr) return;

    const ghExtId = String(pr.number);
    const existing = await this.prisma.pullRequest.findFirst({
      where: { repositoryId: repoId, githubExternalId: ghExtId },
    });

    const { identity } = await this.ghostUserService.resolveGitHubUser(pr.user);
    const ghostUserId = await this.ghostUserService.getGhostUserId();

    let status: PRStatus = PRStatus.OPEN;
    if (pr.merged_at) status = PRStatus.MERGED;
    else if (pr.state === 'closed') status = PRStatus.CLOSED;

    const data = {
      title: pr.title,
      body: pr.body,
      status,
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      isDraft: pr.draft ?? false,
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      externalAuthorId: identity.id,
      syncedAt: new Date(),
    };

    if (action === 'opened' || action === 'reopened') {
      if (existing) {
        await this.prisma.pullRequest.update({ where: { id: existing.id }, data });
      } else {
        const maxPR = await this.prisma.pullRequest.findFirst({
          where: { repositoryId: repoId },
          orderBy: { number: 'desc' },
          select: { number: true },
        });
        await this.prisma.pullRequest.create({
          data: {
            ...data,
            repositoryId: repoId,
            authorId: identity.userId ?? ghostUserId,
            number: (maxPR?.number ?? 0) + 1,
            githubExternalId: ghExtId,
          },
        });
      }
    } else if (action === 'closed' || action === 'edited') {
      if (existing) {
        await this.prisma.pullRequest.update({ where: { id: existing.id }, data });
      }
    } else if (action === 'deleted' && existing) {
      await this.prisma.pullRequest.delete({ where: { id: existing.id } }).catch(() => {});
    }
  }

  private async handleReleaseEvent(repoId: string, payload: GitHubWebhookPayload) {
    const { action, release } = payload;
    if (!release) return;

    const ghExtId = String(release.id);
    const existing = await this.prisma.release.findFirst({
      where: { repositoryId: repoId, githubExternalId: ghExtId },
    });

    const { identity } = await this.ghostUserService.resolveGitHubUser(release.author);
    const ghostUserId = await this.ghostUserService.getGhostUserId();

    if (action === 'published' || action === 'created') {
      // Find or create tag
      let tag = await this.prisma.tag.findUnique({
        where: { repositoryId_name: { repositoryId: repoId, name: release.tag_name } },
      });
      if (!tag) {
        tag = await this.prisma.tag.create({
          data: {
            repositoryId: repoId,
            name: release.tag_name,
            commitSha: '', // Will be resolved on next git sync
          },
        });
      }

      if (existing) {
        await this.prisma.release.update({
          where: { id: existing.id },
          data: {
            name: release.name,
            body: release.body,
            isDraft: release.draft,
            isPrerelease: release.prerelease,
            externalAuthorId: identity.id,
            syncedAt: new Date(),
          },
        });
      } else {
        await this.prisma.release.create({
          data: {
            repositoryId: repoId,
            tagId: tag.id,
            name: release.name,
            body: release.body,
            targetBranch: release.target_commitish,
            isDraft: release.draft,
            isPrerelease: release.prerelease,
            authorId: identity.userId ?? ghostUserId,
            externalAuthorId: identity.id,
            githubExternalId: ghExtId,
            syncedAt: new Date(),
          },
        });
      }
    } else if (action === 'deleted' && existing) {
      await this.prisma.release.delete({ where: { id: existing.id } }).catch(() => {});
    }
  }

  private async handleLabelEvent(repoId: string, payload: GitHubWebhookPayload) {
    const { action, label } = payload;
    if (!label) return;

    if (action === 'created') {
      await this.prisma.label.upsert({
        where: { repositoryId_name: { repositoryId: repoId, name: label.name } },
        create: {
          repositoryId: repoId,
          name: label.name,
          color: `#${label.color}`,
          description: label.description?.slice(0, 200) ?? null,
          syncedAt: new Date(),
        },
        update: {
          color: `#${label.color}`,
          description: label.description?.slice(0, 200) ?? null,
          syncedAt: new Date(),
        },
      });
    } else if (action === 'edited') {
      await this.prisma.label.updateMany({
        where: { repositoryId: repoId, name: label.name },
        data: {
          color: `#${label.color}`,
          description: label.description?.slice(0, 200) ?? null,
          syncedAt: new Date(),
        },
      });
    } else if (action === 'deleted') {
      await this.prisma.label.deleteMany({
        where: { repositoryId: repoId, name: label.name },
      });
    }
  }

  private async handleMilestoneEvent(repoId: string, payload: GitHubWebhookPayload) {
    const { action, milestone } = payload;
    if (!milestone) return;

    const ghExtId = String(milestone.number);

    if (action === 'created' || action === 'edited') {
      await this.prisma.milestone.upsert({
        where: { repositoryId_title: { repositoryId: repoId, title: milestone.title } },
        create: {
          repositoryId: repoId,
          title: milestone.title,
          description: milestone.description?.slice(0, 500) ?? null,
          dueDate: milestone.due_on ? new Date(milestone.due_on) : null,
          closedAt: milestone.closed_at ? new Date(milestone.closed_at) : null,
          githubExternalId: ghExtId,
          syncedAt: new Date(),
        },
        update: {
          title: milestone.title,
          description: milestone.description?.slice(0, 500) ?? null,
          dueDate: milestone.due_on ? new Date(milestone.due_on) : null,
          closedAt: milestone.closed_at ? new Date(milestone.closed_at) : null,
          syncedAt: new Date(),
        },
      });
    } else if (action === 'deleted') {
      await this.prisma.milestone.deleteMany({
        where: { repositoryId: repoId, githubExternalId: ghExtId },
      });
    }
  }

  private async handlePushEvent(repoId: string, payload: GitHubWebhookPayload) {
    // For push events, we mainly update the lastSyncedAt to trigger a git pull
    await this.prisma.repository.update({
      where: { id: repoId },
      data: { lastSyncedAt: new Date() },
    });
    this.logger.log(`Push event received for repo ${repoId}, marking for sync`);
  }

  /**
   * List recent webhook events for repositories owned by the user.
   */
  async listRecentEvents(userId: string, limit = 50) {
    const repos = await this.prisma.repository.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    const repoIds = repos.map((r) => r.id);

    const events = await this.prisma.gitHubWebhookEvent.findMany({
      where: { repositoryId: { in: repoIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        repositoryId: true,
        eventType: true,
        deliveryId: true,
        processed: true,
        error: true,
        createdAt: true,
      },
    });

    return events;
  }
}
