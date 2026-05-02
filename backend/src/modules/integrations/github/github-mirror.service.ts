import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { PrismaService } from '../../../prisma/prisma.service';
import { GitHubRateLimitService } from './github-rate-limit.service';

@Injectable()
export class GitHubMirrorService {
  private readonly logger = new Logger(GitHubMirrorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: GitHubRateLimitService,
  ) {}

  private async getOctokitForRepo(repositoryId: string): Promise<{ octokit: Octokit; repoFullName: string; owner: string; repo: string }> {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        ownerUser: { select: { id: true } },
      },
    });

    if (!repo || !repo.githubRepoFullName) {
      throw new BadRequestException('Repository not linked to GitHub');
    }

    const ownerUserId = repo.ownerUserId;
    if (!ownerUserId) {
      throw new BadRequestException('No owner found for repository');
    }

    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: { userId: ownerUserId, provider: 'github' },
    });

    if (!oauthAccount?.encryptedAccessToken) {
      throw new BadRequestException('GitHub account not linked for repository owner');
    }

    const [owner, repoName] = repo.githubRepoFullName.split('/');
    return {
      octokit: new Octokit({ auth: oauthAccount.encryptedAccessToken }),
      repoFullName: repo.githubRepoFullName,
      owner,
      repo: repoName,
    };
  }

  // ─── Issue Mirror ───────────────────────────────────────────

  async createIssueOnGitHub(repositoryId: string, issueId: string): Promise<number> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: { labels: { include: { label: true } } },
    });

    if (!issue) throw new BadRequestException('Issue not found');

    await this.rateLimitService.respectRateLimit(issue.authorId);

    const { data: ghIssue } = await octokit.issues.create({
      owner,
      repo,
      title: issue.title,
      body: issue.body ?? undefined,
      labels: issue.labels.map((l) => l.label.name),
    });

    await this.prisma.issue.update({
      where: { id: issue.id },
      data: { githubExternalId: String(ghIssue.number), syncedAt: new Date() },
    });

    this.logger.log(`Created GitHub issue #${ghIssue.number} for local issue ${issueId}`);
    return ghIssue.number;
  }

  async updateIssueOnGitHub(repositoryId: string, issueId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: { labels: { include: { label: true } } },
    });

    if (!issue || !issue.githubExternalId) {
      throw new BadRequestException('Issue not linked to GitHub');
    }

    await this.rateLimitService.respectRateLimit(issue.authorId);

    const issueNumber = Number(issue.githubExternalId);

    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      title: issue.title,
      body: issue.body ?? undefined,
      state: issue.status === 'OPEN' ? 'open' : 'closed',
      labels: issue.labels.map((l) => l.label.name),
    });

    await this.prisma.issue.update({
      where: { id: issue.id },
      data: { syncedAt: new Date() },
    });

    this.logger.log(`Updated GitHub issue #${issueNumber}`);
  }

  // ─── Comment Mirror ─────────────────────────────────────────

  async createCommentOnGitHub(
    repositoryId: string,
    commentId: string,
  ): Promise<number> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { issue: true, pullRequest: true },
    });

    if (!comment) throw new BadRequestException('Comment not found');

    const parent = comment.issue ?? comment.pullRequest;
    if (!parent || !parent.githubExternalId) {
      throw new BadRequestException('Parent not linked to GitHub');
    }

    await this.rateLimitService.respectRateLimit(comment.authorId);

    const { data: ghComment } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: Number(parent.githubExternalId),
      body: comment.body,
    });

    await this.prisma.comment.update({
      where: { id: comment.id },
      data: { githubExternalId: String(ghComment.id), syncedAt: new Date() },
    });

    return ghComment.id;
  }

  async updateCommentOnGitHub(repositoryId: string, commentId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || !comment.githubExternalId) {
      throw new BadRequestException('Comment not linked to GitHub');
    }

    await this.rateLimitService.respectRateLimit(comment.authorId);

    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: Number(comment.githubExternalId),
      body: comment.body,
    });

    await this.prisma.comment.update({
      where: { id: comment.id },
      data: { syncedAt: new Date() },
    });
  }

  async deleteCommentOnGitHub(repositoryId: string, commentId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || !comment.githubExternalId) return;

    await this.rateLimitService.respectRateLimit(comment.authorId);

    await octokit.issues.deleteComment({
      owner,
      repo,
      comment_id: Number(comment.githubExternalId),
    });
  }

  // ─── Pull Request Mirror ────────────────────────────────────

  async createPROnGitHub(repositoryId: string, prId: string): Promise<number> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { id: prId },
      include: { labels: { include: { label: true } } },
    });

    if (!pr) throw new BadRequestException('Pull request not found');

    await this.rateLimitService.respectRateLimit(pr.authorId);

    const { data: ghPR } = await octokit.pulls.create({
      owner,
      repo,
      title: pr.title,
      body: pr.body ?? undefined,
      head: pr.sourceBranch,
      base: pr.targetBranch,
      draft: pr.isDraft,
    });

    await this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: { githubExternalId: String(ghPR.number), syncedAt: new Date() },
    });

    this.logger.log(`Created GitHub PR #${ghPR.number} for local PR ${prId}`);
    return ghPR.number;
  }

  async updatePROnGitHub(repositoryId: string, prId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { id: prId },
      include: { labels: { include: { label: true } } },
    });

    if (!pr || !pr.githubExternalId) {
      throw new BadRequestException('Pull request not linked to GitHub');
    }

    await this.rateLimitService.respectRateLimit(pr.authorId);

    const prNumber = Number(pr.githubExternalId);

    await octokit.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      title: pr.title,
      body: pr.body ?? undefined,
      state: pr.status === 'OPEN' ? 'open' : 'closed',
    });

    await this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: { syncedAt: new Date() },
    });

    this.logger.log(`Updated GitHub PR #${prNumber}`);
  }

  // ─── Release Mirror ─────────────────────────────────────────

  async createReleaseOnGitHub(repositoryId: string, releaseId: string): Promise<number> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      include: { tag: true },
    });

    if (!release) throw new BadRequestException('Release not found');

    await this.rateLimitService.respectRateLimit(release.authorId);

    const { data: ghRelease } = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: release.tag.name,
      name: release.name,
      body: release.body ?? undefined,
      draft: release.isDraft,
      prerelease: release.isPrerelease,
      target_commitish: release.targetBranch,
    });

    await this.prisma.release.update({
      where: { id: release.id },
      data: { githubExternalId: String(ghRelease.id), syncedAt: new Date() },
    });

    this.logger.log(`Created GitHub release ${ghRelease.id} for local release ${releaseId}`);
    return ghRelease.id;
  }

  async updateReleaseOnGitHub(repositoryId: string, releaseId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });

    if (!release || !release.githubExternalId) {
      throw new BadRequestException('Release not linked to GitHub');
    }

    await this.rateLimitService.respectRateLimit(release.authorId);

    await octokit.repos.updateRelease({
      owner,
      repo,
      release_id: Number(release.githubExternalId),
      name: release.name,
      body: release.body ?? undefined,
      draft: release.isDraft,
      prerelease: release.isPrerelease,
    });

    await this.prisma.release.update({
      where: { id: release.id },
      data: { syncedAt: new Date() },
    });
  }

  async deleteReleaseOnGitHub(repositoryId: string, releaseId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });

    if (!release || !release.githubExternalId) return;

    await this.rateLimitService.respectRateLimit(release.authorId);

    await octokit.repos.deleteRelease({
      owner,
      repo,
      release_id: Number(release.githubExternalId),
    });
  }

  // ─── Label & Milestone Mirror ───────────────────────────────

  async createLabelOnGitHub(repositoryId: string, labelId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const label = await this.prisma.label.findUnique({ where: { id: labelId } });
    if (!label) throw new BadRequestException('Label not found');

    const { data: ghLabel } = await octokit.issues.createLabel({
      owner,
      repo,
      name: label.name,
      color: label.color.replace('#', ''),
      description: label.description ?? undefined,
    });

    await this.prisma.label.update({
      where: { id: label.id },
      data: { githubExternalId: String(ghLabel.id), syncedAt: new Date() },
    });
  }

  async updateLabelOnGitHub(repositoryId: string, labelId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const label = await this.prisma.label.findUnique({ where: { id: labelId } });
    if (!label || !label.githubExternalId) return;

    await octokit.issues.updateLabel({
      owner,
      repo,
      name: label.name,
      new_name: label.name,
      color: label.color.replace('#', ''),
      description: label.description ?? undefined,
    });

    await this.prisma.label.update({
      where: { id: label.id },
      data: { syncedAt: new Date() },
    });
  }

  async deleteLabelOnGitHub(repositoryId: string, labelId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const label = await this.prisma.label.findUnique({ where: { id: labelId } });
    if (!label) return;

    await octokit.issues.deleteLabel({
      owner,
      repo,
      name: label.name,
    }).catch(() => {});
  }

  async createMilestoneOnGitHub(repositoryId: string, milestoneId: string): Promise<number> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const milestone = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) throw new BadRequestException('Milestone not found');

    const { data: ghMilestone } = await octokit.issues.createMilestone({
      owner,
      repo,
      title: milestone.title,
      description: milestone.description ?? undefined,
      due_on: milestone.dueDate ? milestone.dueDate.toISOString() : undefined,
      state: milestone.closedAt ? 'closed' : 'open',
    });

    await this.prisma.milestone.update({
      where: { id: milestone.id },
      data: { githubExternalId: String(ghMilestone.number), syncedAt: new Date() },
    });

    return ghMilestone.number;
  }

  async updateMilestoneOnGitHub(repositoryId: string, milestoneId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const milestone = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || !milestone.githubExternalId) return;

    await octokit.issues.updateMilestone({
      owner,
      repo,
      milestone_number: Number(milestone.githubExternalId),
      title: milestone.title,
      description: milestone.description ?? undefined,
      due_on: milestone.dueDate ? milestone.dueDate.toISOString() : undefined,
      state: milestone.closedAt ? 'closed' : 'open',
    });

    await this.prisma.milestone.update({
      where: { id: milestone.id },
      data: { syncedAt: new Date() },
    });
  }

  async deleteMilestoneOnGitHub(repositoryId: string, milestoneId: string): Promise<void> {
    const { octokit, owner, repo } = await this.getOctokitForRepo(repositoryId);
    const milestone = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || !milestone.githubExternalId) return;

    await octokit.issues.deleteMilestone({
      owner,
      repo,
      milestone_number: Number(milestone.githubExternalId),
    }).catch(() => {});
  }
}
