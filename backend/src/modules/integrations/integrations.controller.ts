import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  RawBody,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GitHubService } from './github/github.service';
import { GitHubWebhookService } from './github/github-webhook.service';
import { GitHubIncrementalSyncService } from './github/github-incremental-sync.service';
import { GitHubMirrorService } from './github/github-mirror.service';
import { GitHubRateLimitService } from './github/github-rate-limit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/github')
export class IntegrationsController {
  constructor(
    private readonly githubService: GitHubService,
    private readonly webhookService: GitHubWebhookService,
    private readonly incrementalSyncService: GitHubIncrementalSyncService,
    private readonly mirrorService: GitHubMirrorService,
    private readonly rateLimitService: GitHubRateLimitService,
    @InjectQueue('github-import') private readonly importQueue: Queue,
    @InjectQueue('github-sync') private readonly syncQueue: Queue,
  ) {}

  // ─── Profile & Permissions ──────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get linked GitHub profile' })
  async getGitHubProfile(@CurrentUser() user: JwtPayload) {
    return this.githubService.getGitHubProfile(user.sub);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Check GitHub OAuth permission scopes' })
  async checkPermissions(@CurrentUser() user: JwtPayload) {
    return this.githubService.checkPermissions(user.sub);
  }

  @Get('repos')
  @ApiOperation({ summary: 'List GitHub repositories' })
  async listRepos(@CurrentUser() user: JwtPayload) {
    return this.githubService.listGitHubRepos(user.sub);
  }

  // ─── Import ─────────────────────────────────────────────────

  @Post('repos/:owner/:repo/import')
  @ApiOperation({ summary: 'Import a GitHub repository (async with progress)' })
  async importRepo(
    @CurrentUser() user: JwtPayload,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    const result = await this.githubService.initiateImport(user.sub, `${owner}/${repo}`);

    if (result.jobId && !(result as Record<string, unknown>).alreadyRunning) {
      await this.importQueue.add(
        'import',
        {
          jobId: result.jobId,
          userId: user.sub,
          githubRepoFullName: `${owner}/${repo}`,
        },
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    return result;
  }

  @Get('import/:jobId/status')
  @ApiOperation({ summary: 'Get import job progress' })
  async getImportStatus(@Param('jobId') jobId: string) {
    return this.githubService.getImportStatus(jobId);
  }

  // ─── Sync (Metadata + Incremental) ──────────────────────────

  @Post('repos/:owner/:repo/sync')
  @ApiOperation({ summary: 'Sync repository metadata from GitHub (async)' })
  async syncRepo(
    @CurrentUser() user: JwtPayload,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    // Enqueue to BullMQ instead of running inline
    const job = await this.syncQueue.add(
      'sync',
      {
        userId: user.sub,
        githubRepoFullName: `${owner}/${repo}`,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { jobId: job.id, message: 'Sync queued' };
  }

  @Post('repos/:owner/:repo/sync/incremental')
  @ApiOperation({ summary: 'Incremental sync of issues, PRs, comments, labels, milestones, releases' })
  async syncIncremental(
    @CurrentUser() user: JwtPayload,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    const repository = await this.githubService.findLinkedRepository(user.sub, `${owner}/${repo}`);
    const token = await this.githubService.getUserGitHubToken(user.sub);

    const result = await this.incrementalSyncService.syncRepository(repository.id, user.sub, token);
    return result;
  }

  @Get('repos/:owner/:repo/sync/status')
  @ApiOperation({ summary: 'Get last sync status for a repository' })
  async getSyncStatus(
    @CurrentUser() user: JwtPayload,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    const repository = await this.githubService.findLinkedRepository(user.sub, `${owner}/${repo}`);
    return {
      lastSyncedAt: repository.lastSyncedAt,
      mirrorEnabled: repository.mirrorEnabled,
      githubRepoFullName: repository.githubRepoFullName,
    };
  }

  // ─── Rate Limit & Token Health ──────────────────────────────

  @Get('rate-limit')
  @ApiOperation({ summary: 'Get current GitHub API rate limit status' })
  async getRateLimit(@CurrentUser() user: JwtPayload) {
    return this.rateLimitService.getRateLimitStatus(user.sub);
  }

  @Get('token-health')
  @ApiOperation({ summary: 'Check if GitHub token is valid' })
  async checkTokenHealth(@CurrentUser() user: JwtPayload) {
    return this.rateLimitService.checkTokenHealth(user.sub);
  }

  // ─── Webhooks ───────────────────────────────────────────────

  @Post('webhook')
  @ApiOperation({ summary: 'Receive GitHub webhook events' })
  async receiveWebhook(
    @Headers('x-github-event') eventType: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    if (!eventType || !deliveryId) {
      throw new BadRequestException('Missing GitHub webhook headers');
    }

    const result = await this.webhookService.processWebhook(
      eventType,
      deliveryId,
      payload,
      signature,
    );

    return result;
  }

  @Get('webhook/events')
  @ApiOperation({ summary: 'List recent webhook events' })
  async listWebhookEvents(@CurrentUser() user: JwtPayload) {
    return this.webhookService.listRecentEvents(user.sub);
  }

  // ─── Mirror (Push local changes to GitHub) ──────────────────

  @Post('mirror/issues/:issueId')
  @ApiOperation({ summary: 'Create/update an issue on GitHub' })
  async mirrorIssue(
    @CurrentUser() user: JwtPayload,
    @Param('issueId') issueId: string,
  ) {
    const issue = await this.mirrorService['prisma'].issue.findUnique({
      where: { id: issueId },
      select: { repositoryId: true, githubExternalId: true },
    });
    if (!issue) throw new BadRequestException('Issue not found');

    if (issue.githubExternalId) {
      await this.mirrorService.updateIssueOnGitHub(issue.repositoryId, issueId);
      return { mirrored: true, action: 'updated' };
    } else {
      const ghNumber = await this.mirrorService.createIssueOnGitHub(issue.repositoryId, issueId);
      return { mirrored: true, action: 'created', githubNumber: ghNumber };
    }
  }

  @Post('mirror/pull-requests/:prId')
  @ApiOperation({ summary: 'Create/update a pull request on GitHub' })
  async mirrorPR(
    @CurrentUser() user: JwtPayload,
    @Param('prId') prId: string,
  ) {
    const pr = await this.mirrorService['prisma'].pullRequest.findUnique({
      where: { id: prId },
      select: { repositoryId: true, githubExternalId: true },
    });
    if (!pr) throw new BadRequestException('Pull request not found');

    if (pr.githubExternalId) {
      await this.mirrorService.updatePROnGitHub(pr.repositoryId, prId);
      return { mirrored: true, action: 'updated' };
    } else {
      const ghNumber = await this.mirrorService.createPROnGitHub(pr.repositoryId, prId);
      return { mirrored: true, action: 'created', githubNumber: ghNumber };
    }
  }

  @Post('mirror/comments/:commentId')
  @ApiOperation({ summary: 'Create/update a comment on GitHub' })
  async mirrorComment(
    @CurrentUser() user: JwtPayload,
    @Param('commentId') commentId: string,
  ) {
    const comment = await this.mirrorService['prisma'].comment.findUnique({
      where: { id: commentId },
      select: {
        githubExternalId: true,
        issue: { select: { repositoryId: true } },
        pullRequest: { select: { repositoryId: true } },
      },
    });
    if (!comment) throw new BadRequestException('Comment not found');

    const repositoryId = comment.issue?.repositoryId ?? comment.pullRequest?.repositoryId;
    if (!repositoryId) throw new BadRequestException('Comment not linked to a repository');

    if (comment.githubExternalId) {
      await this.mirrorService.updateCommentOnGitHub(repositoryId, commentId);
      return { mirrored: true, action: 'updated' };
    } else {
      const ghId = await this.mirrorService.createCommentOnGitHub(repositoryId, commentId);
      return { mirrored: true, action: 'created', githubId: ghId };
    }
  }

  @Post('mirror/releases/:releaseId')
  @ApiOperation({ summary: 'Create/update a release on GitHub' })
  async mirrorRelease(
    @CurrentUser() user: JwtPayload,
    @Param('releaseId') releaseId: string,
  ) {
    const release = await this.mirrorService['prisma'].release.findUnique({
      where: { id: releaseId },
      select: { repositoryId: true, githubExternalId: true },
    });
    if (!release) throw new BadRequestException('Release not found');

    if (release.githubExternalId) {
      await this.mirrorService.updateReleaseOnGitHub(release.repositoryId, releaseId);
      return { mirrored: true, action: 'updated' };
    } else {
      const ghId = await this.mirrorService.createReleaseOnGitHub(release.repositoryId, releaseId);
      return { mirrored: true, action: 'created', githubId: ghId };
    }
  }

  @Post('mirror/labels/:labelId')
  @ApiOperation({ summary: 'Create/update a label on GitHub' })
  async mirrorLabel(
    @CurrentUser() user: JwtPayload,
    @Param('labelId') labelId: string,
  ) {
    const label = await this.mirrorService['prisma'].label.findUnique({
      where: { id: labelId },
      select: { repositoryId: true, githubExternalId: true },
    });
    if (!label) throw new BadRequestException('Label not found');

    if (label.githubExternalId) {
      await this.mirrorService.updateLabelOnGitHub(label.repositoryId, labelId);
      return { mirrored: true, action: 'updated' };
    } else {
      await this.mirrorService.createLabelOnGitHub(label.repositoryId, labelId);
      return { mirrored: true, action: 'created' };
    }
  }

  @Post('mirror/milestones/:milestoneId')
  @ApiOperation({ summary: 'Create/update a milestone on GitHub' })
  async mirrorMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('milestoneId') milestoneId: string,
  ) {
    const milestone = await this.mirrorService['prisma'].milestone.findUnique({
      where: { id: milestoneId },
      select: { repositoryId: true, githubExternalId: true },
    });
    if (!milestone) throw new BadRequestException('Milestone not found');

    if (milestone.githubExternalId) {
      await this.mirrorService.updateMilestoneOnGitHub(milestone.repositoryId, milestoneId);
      return { mirrored: true, action: 'updated' };
    } else {
      const ghNumber = await this.mirrorService.createMilestoneOnGitHub(milestone.repositoryId, milestoneId);
      return { mirrored: true, action: 'created', githubNumber: ghNumber };
    }
  }
}
