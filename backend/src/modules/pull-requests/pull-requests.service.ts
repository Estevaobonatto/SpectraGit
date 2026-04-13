import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PRStatus, MergeStrategy, CommentType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import {
  UpdatePullRequestDto,
  MergePullRequestDto,
  CreatePRCommentDto,
} from './dto/update-pull-request.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateContextBlocksDto } from './dto/update-context-blocks.dto';
import { AddReviewerDto } from './dto/add-reviewer.dto';
import { ResolveCommentDto } from './dto/resolve-comment.dto';
import { AddDependencyDto } from './dto/add-dependency.dto';
import { SetLabelsDto } from './dto/set-labels.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { EventsService } from '../../events/events.service';

@Injectable()
export class PullRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
    private readonly reposService: RepositoriesService,
    private readonly eventsService: EventsService,
  ) {}

  async create(owner: string, repo: string, userId: string, dto: CreatePullRequestDto) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    if (dto.sourceBranch === dto.targetBranch) {
      throw new BadRequestException('Source and target branches must be different');
    }

    const existing = await this.prisma.pullRequest.findFirst({
      where: {
        repositoryId: repoEntity.id,
        sourceBranch: dto.sourceBranch,
        targetBranch: dto.targetBranch,
        status: PRStatus.OPEN,
      },
    });
    if (existing) {
      throw new ConflictException('An open pull request for these branches already exists');
    }

    const lastPR = await this.prisma.pullRequest.findFirst({
      where: { repositoryId: repoEntity.id },
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastPR?.number ?? 0) + 1;

    const pr = await this.prisma.pullRequest.create({
      data: {
        repositoryId: repoEntity.id,
        authorId: userId,
        number: nextNumber,
        title: dto.title,
        body: dto.body,
        sourceBranch: dto.sourceBranch,
        targetBranch: dto.targetBranch,
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    this.eventsService.emit('pr.created', {
      repositoryId: repoEntity.id,
      pullRequestId: pr.id,
      prNumber: pr.number,
      title: pr.title,
      authorId: userId,
    });

    return pr;
  }

  async findAll(
    owner: string,
    repo: string,
    pagination: PaginationDto,
    status?: PRStatus,
    userId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const where = {
      repositoryId: repoEntity.id,
      ...(status ? { status } : {}),
      ...(pagination.search
        ? { title: { contains: pagination.search, mode: 'insensitive' as const } }
        : {}),
    };

    const orderBy = { [pagination.sort ?? 'createdAt']: pagination.sortOrder ?? 'desc' };

    const [rawItems, total] = await Promise.all([
      this.prisma.pullRequest.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy,
        include: {
          author: { select: { username: true, avatarUrl: true } },
          labels: { include: { label: true } },
          reviews: { select: { id: true, status: true, reviewerId: true } },
          requestedReviewers: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
          _count: { select: { reviews: true, comments: true } },
        },
      }),
      this.prisma.pullRequest.count({ where }),
    ]);

    const items = rawItems.map((pr) => ({
      ...pr,
      labels: pr.labels.map((pl) => pl.label),
    }));

    return {
      items,
      total,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      totalPages: Math.ceil(total / (pagination.limit ?? 20)),
    };
  }

  async findByNumber(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        merger: { select: { username: true, avatarUrl: true } },
        reviews: {
          include: {
            reviewer: { select: { username: true, avatarUrl: true } },
            comments: { include: { author: { select: { username: true, avatarUrl: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          where: { type: CommentType.PULL_REQUEST },
          include: {
            author: { select: { username: true, avatarUrl: true } },
            resolvedBy: { select: { username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        labels: { include: { label: true } },
        requestedReviewers: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
        dependenciesOut: true,
        dependenciesIn: true,
      },
    });

    if (!pr) throw new NotFoundException('Pull request not found');

    const diffStats = await this.getDiffFileStats(owner, repo, pr.sourceBranch, pr.targetBranch);
    const repoWithConfig = await this.prisma.repository.findUnique({
      where: { id: repoEntity.id },
      select: { prRiskConfig: true },
    });
    const diff = await this.gitService
      .getDiffBetween(owner, repo, pr.targetBranch, pr.sourceBranch)
      .catch(() => '');
    const fileHeaders = diff.match(/^diff --git a\/.+ b\/.+$/gm) ?? [];
    const filePaths = fileHeaders.map(
      (h: string) => h.replace('diff --git a/', '').split(' b/')[0],
    );
    const riskLevel = this.computeRiskLevel(
      diffStats,
      filePaths,
      (repoWithConfig?.prRiskConfig as {
        maxFiles?: number;
        maxLines?: number;
        criticalPaths?: string[];
      } | null) ?? null,
    );

    return {
      ...pr,
      labels: pr.labels.map((pl) => pl.label),
      diffStats,
      riskLevel,
    };
  }

  async getDiff(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    return this.gitService.getDiffBetweenFiles(owner, repo, pr.targetBranch, pr.sourceBranch);
  }

  async update(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: UpdatePullRequestDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const { checklist, contextBlocks, ...rest } = dto;
    return this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: {
        ...rest,
        ...(checklist !== undefined && {
          checklist: checklist as unknown as import('@prisma/client').Prisma.InputJsonValue,
        }),
        ...(contextBlocks !== undefined && {
          contextBlocks: contextBlocks as unknown as import('@prisma/client').Prisma.InputJsonValue,
        }),
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });
  }

  async close(owner: string, repo: string, prNumber: number, userId: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');
    if (pr.status !== PRStatus.OPEN) {
      throw new BadRequestException('Pull request is not open');
    }

    return this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: { status: PRStatus.CLOSED },
    });
  }

  async merge(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: MergePullRequestDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');
    if (pr.status !== PRStatus.OPEN) {
      throw new BadRequestException('Pull request is not open');
    }

    const hasConflicts = await this.gitService.checkMergeConflicts(
      owner,
      repo,
      pr.sourceBranch,
      pr.targetBranch,
    );
    if (hasConflicts) {
      throw new ConflictException('Merge conflicts detected. Resolve conflicts before merging.');
    }

    const squash = dto.strategy === MergeStrategy.SQUASH;
    const mergeSha = await this.gitService.mergeBranches(
      owner,
      repo,
      pr.sourceBranch,
      pr.targetBranch,
      squash,
    );

    const merged = await this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: {
        status: PRStatus.MERGED,
        mergeStrategy: dto.strategy,
        mergedBy: userId,
        mergedAt: new Date(),
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        merger: { select: { username: true, avatarUrl: true } },
      },
    });

    await this.prisma.branch.updateMany({
      where: { repositoryId: repoEntity.id, name: pr.targetBranch },
      data: { headCommitSha: mergeSha },
    });

    this.eventsService.emit('pr.merged', {
      repositoryId: repoEntity.id,
      pullRequestId: pr.id,
      mergedBy: userId,
    });

    return merged;
  }

  async addComment(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: CreatePRCommentDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const comment = await this.prisma.comment.create({
      data: {
        authorId: userId,
        type: CommentType.PULL_REQUEST,
        pullRequestId: pr.id,
        body: dto.body,
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    this.eventsService.emit('pr.comment', {
      repositoryId: repoEntity.id,
      pullRequestId: pr.id,
      commentId: comment.id,
      authorId: userId,
    });

    return comment;
  }

  // ─── Utility: Diff File Stats ─────────────────────────────────

  private async getDiffFileStats(
    owner: string,
    repo: string,
    sourceBranch: string,
    targetBranch: string,
  ) {
    let diff = '';
    try {
      diff = await this.gitService.getDiffBetween(owner, repo, targetBranch, sourceBranch);
    } catch {
      return {
        filesChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
        commitCount: 0,
        categories: { backend: 0, frontend: 0, database: 0, docs: 0, infra: 0 },
      };
    }

    const fileHeaders = diff.match(/^diff --git a\/.+ b\/.+$/gm) ?? [];
    const filesChanged = fileHeaders.length;

    const additions = (diff.match(/^\+(?!\+\+).*/gm) ?? []).length;
    const deletions = (diff.match(/^-(?!--).*/gm) ?? []).length;

    const filePaths = fileHeaders.map((h) => h.replace('diff --git a/', '').split(' b/')[0]);

    const categories = { backend: 0, frontend: 0, database: 0, docs: 0, infra: 0 };
    for (const fp of filePaths) {
      if (/\.(sql|prisma)$/i.test(fp) || fp.includes('migrations/') || fp.includes('schema.')) {
        categories.database++;
      } else if (
        /^(frontend|src\/app|src\/pages|src\/components|src\/features)/i.test(fp) ||
        /\.(tsx|jsx|css|scss)$/.test(fp)
      ) {
        categories.frontend++;
      } else if (
        /^(backend|src\/modules|src\/main|src\/config)/i.test(fp) ||
        /\.(controller|service|module|guard|interceptor)\.(ts)$/.test(fp)
      ) {
        categories.backend++;
      } else if (
        /\.(md|txt|rst|adoc)$/i.test(fp) ||
        fp.includes('docs/') ||
        fp.includes('README')
      ) {
        categories.docs++;
      } else if (
        /^(nginx|docker|\.github|infra|k8s)/i.test(fp) ||
        /\.(yml|yaml|dockerfile|conf|env)/i.test(fp)
      ) {
        categories.infra++;
      } else {
        categories.backend++;
      }
    }

    // Rough commit count from diff header blocks
    const commitCount = (diff.match(/^From [0-9a-f]{40}/gm) ?? []).length || 1;

    return {
      filesChanged,
      linesAdded: additions,
      linesRemoved: deletions,
      commitCount,
      categories,
    };
  }

  // ─── Utility: Risk Level ────────────────────────────────────────

  private computeRiskLevel(
    diffStats: {
      filesChanged: number;
      linesAdded: number;
      linesRemoved: number;
      categories: { database: number; infra: number };
    },
    filePaths: string[],
    riskConfig: { maxFiles?: number; maxLines?: number; criticalPaths?: string[] } | null,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const maxFiles = riskConfig?.maxFiles ?? 20;
    const maxLines = riskConfig?.maxLines ?? 500;
    const criticalPaths = riskConfig?.criticalPaths ?? [
      'prisma/schema.prisma',
      'src/main.ts',
      'src/config',
      'migrations/',
    ];

    const totalLines = diffStats.linesAdded + diffStats.linesRemoved;
    const touchesCritical = filePaths.some((fp) => criticalPaths.some((cp) => fp.includes(cp)));

    if (touchesCritical || diffStats.categories.database > 0) return 'CRITICAL';
    if (diffStats.filesChanged > maxFiles || totalLines > maxLines * 2) return 'HIGH';
    if (diffStats.filesChanged > maxFiles / 2 || totalLines > maxLines) return 'MEDIUM';
    return 'LOW';
  }

  // ─── Utility: Timeline Builder ──────────────────────────────────

  private buildTimeline(
    pr: {
      author: { username: string; avatarUrl: string | null } | null;
      merger?: { username: string; avatarUrl: string | null } | null;
      status: string;
      createdAt: Date;
      mergedAt?: Date | null;
      updatedAt: Date;
      title: string;
      mergeStrategy?: string | null;
    },
    reviews: Array<{
      reviewer: { username: string; avatarUrl: string | null } | null;
      status: string;
      body?: string | null;
      createdAt: Date;
    }>,
    comments: Array<{
      author: { username: string; avatarUrl: string | null } | null;
      body: string;
      createdAt: Date;
      resolved?: boolean | null;
    }>,
  ) {
    const events: Array<{
      type: string;
      actor: { username: string; avatarUrl: string | null } | null | undefined;
      message: string;
      timestamp: Date;
      metadata: Record<string, unknown>;
    }> = [];

    events.push({
      type: 'PR_OPENED',
      actor: pr.author,
      message: `opened this pull request`,
      timestamp: pr.createdAt,
      metadata: { title: pr.title },
    });

    for (const comment of comments) {
      events.push({
        type: 'COMMENT',
        actor: comment.author,
        message: 'left a comment',
        timestamp: comment.createdAt,
        metadata: { body: comment.body, resolved: comment.resolved },
      });
    }

    for (const review of reviews) {
      const msgMap: Record<string, string> = {
        APPROVED: 'approved these changes',
        CHANGES_REQUESTED: 'requested changes',
        COMMENTED: 'reviewed without approval',
      };
      events.push({
        type: `REVIEW_${review.status}`,
        actor: review.reviewer,
        message: msgMap[review.status] ?? 'reviewed',
        timestamp: review.createdAt,
        metadata: { body: review.body, status: review.status },
      });
    }

    if (pr.status === PRStatus.MERGED && pr.mergedAt) {
      events.push({
        type: 'MERGED',
        actor: pr.merger,
        message: `merged this pull request`,
        timestamp: pr.mergedAt,
        metadata: { strategy: pr.mergeStrategy },
      });
    }

    if (pr.status === PRStatus.CLOSED && !pr.mergedAt) {
      events.push({
        type: 'CLOSED',
        actor: pr.author,
        message: 'closed this pull request without merging',
        timestamp: pr.updatedAt,
        metadata: {},
      });
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // ─── Summary ──────────────────────────────────────────────────

  async getSummary(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        reviews: true,
        _count: { select: { comments: true } },
      },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const diffStats = await this.getDiffFileStats(owner, repo, pr.sourceBranch, pr.targetBranch);
    const riskConfigRaw = repoEntity.prRiskConfig;
    const riskConfig = riskConfigRaw as {
      maxFiles?: number;
      maxLines?: number;
      criticalPaths?: string[];
    } | null;

    // Extract file paths for risk calculation (re-run diff to get paths)
    const diff = await this.gitService
      .getDiffBetween(owner, repo, pr.targetBranch, pr.sourceBranch)
      .catch(() => '');
    const fileHeaders = diff.match(/^diff --git a\/.+ b\/.+$/gm) ?? [];
    const filePaths = fileHeaders.map(
      (h: string) => h.replace('diff --git a/', '').split(' b/')[0],
    );

    const riskLevel = this.computeRiskLevel(diffStats, filePaths, riskConfig);
    const reviewCounts = pr.reviews.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      prNumber,
      title: pr.title,
      status: pr.status,
      isDraft: pr.isDraft,
      author: pr.author,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      diffStats,
      riskLevel,
      reviewCounts,
      commentCount: pr._count.comments,
      createdAt: pr.createdAt,
    };
  }

  // ─── Timeline ─────────────────────────────────────────────────

  async getTimeline(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        merger: { select: { username: true, avatarUrl: true } },
        reviews: {
          include: { reviewer: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          where: { type: CommentType.PULL_REQUEST },
          include: { author: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    return this.buildTimeline(pr, pr.reviews, pr.comments);
  }

  // ─── Blockers ─────────────────────────────────────────────────

  async getBlockers(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
      include: {
        reviews: true,
        requestedReviewers: { include: { user: { select: { username: true } } } },
      },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const blockers: Array<{ type: string; message: string }> = [];

    if (pr.status !== PRStatus.OPEN) {
      return blockers;
    }

    // Check merge conflicts
    const hasConflicts = await this.gitService
      .checkMergeConflicts(owner, repo, pr.sourceBranch, pr.targetBranch)
      .catch(() => false);
    if (hasConflicts) {
      blockers.push({ type: 'CONFLICT', message: 'Merge conflicts detected between branches' });
    }

    // Check unaddressed change requests
    const changesRequested = pr.reviews.filter((r) => r.status === 'CHANGES_REQUESTED');
    if (changesRequested.length > 0) {
      blockers.push({
        type: 'CHANGES_REQUESTED',
        message: `${changesRequested.length} reviewer(s) have requested changes`,
      });
    }

    // Check pending requested reviewers without review
    const reviewerIds = new Set(pr.reviews.map((r) => r.reviewerId));
    const pendingReviewers = pr.requestedReviewers.filter((rr) => !reviewerIds.has(rr.userId));
    if (pendingReviewers.length > 0) {
      const names = pendingReviewers.map((rr) => rr.user.username).join(', ');
      blockers.push({ type: 'REVIEW_PENDING', message: `Awaiting review from: ${names}` });
    }

    // Check draft status
    if (pr.isDraft) {
      blockers.push({ type: 'DRAFT', message: 'This pull request is still a draft' });
    }

    return blockers;
  }

  // ─── Checklist ────────────────────────────────────────────────

  async updateChecklist(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: UpdateChecklistDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    return this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: { checklist: dto.items as unknown as Prisma.InputJsonValue },
      select: { id: true, checklist: true },
    });
  }

  // ─── Context Blocks ───────────────────────────────────────────

  async updateContextBlocks(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: UpdateContextBlocksDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    return this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: { contextBlocks: dto as unknown as Prisma.InputJsonValue },
      select: { id: true, contextBlocks: true },
    });
  }

  // ─── Reviewers ────────────────────────────────────────────────

  async addReviewer(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: AddReviewerDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');
    if (pr.authorId === dto.userId) {
      throw new BadRequestException('The PR author cannot be a requested reviewer');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, username: true, avatarUrl: true },
    });
    if (!reviewer) throw new NotFoundException('User not found');

    const entry = await this.prisma.pullRequestReviewer.upsert({
      where: { pullRequestId_userId: { pullRequestId: pr.id, userId: dto.userId } },
      create: { pullRequestId: pr.id, userId: dto.userId },
      update: {},
      include: { user: { select: { username: true, avatarUrl: true } } },
    });

    return entry;
  }

  async removeReviewer(
    owner: string,
    repo: string,
    prNumber: number,
    reviewerUserId: string,
    actingUserId: string,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, actingUserId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    await this.prisma.pullRequestReviewer.deleteMany({
      where: { pullRequestId: pr.id, userId: reviewerUserId },
    });

    return { success: true };
  }

  // ─── Comment Resolution ───────────────────────────────────────

  async resolveComment(
    owner: string,
    repo: string,
    prNumber: number,
    commentId: string,
    userId: string,
    dto: ResolveCommentDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, pullRequestId: pr.id },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        resolved: dto.resolved,
        resolvedById: dto.resolved ? userId : null,
      },
      include: { author: { select: { username: true, avatarUrl: true } } },
    });
  }

  // ─── Labels ───────────────────────────────────────────────────

  async setLabels(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: SetLabelsDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    // Replace all labels atomically
    await this.prisma.pRLabel.deleteMany({ where: { pullRequestId: pr.id } });

    if (dto.labelIds.length > 0) {
      await this.prisma.pRLabel.createMany({
        data: dto.labelIds.map((labelId) => ({ pullRequestId: pr.id, labelId })),
        skipDuplicates: true,
      });
    }

    const updated = await this.prisma.pullRequest.findUnique({
      where: { id: pr.id },
      include: { labels: { include: { label: true } } },
    });
    return { labels: updated?.labels.map((pl) => pl.label) ?? [] };
  }

  // ─── Dependencies ─────────────────────────────────────────────

  async addDependency(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: AddDependencyDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const dependentPR = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!dependentPR) throw new NotFoundException('Pull request not found');

    const dependsOnPR = await this.prisma.pullRequest.findUnique({
      where: {
        repositoryId_number: { repositoryId: repoEntity.id, number: dto.dependsOnPrNumber },
      },
    });
    if (!dependsOnPR) throw new NotFoundException(`PR #${dto.dependsOnPrNumber} not found`);

    if (dependentPR.id === dependsOnPR.id) {
      throw new BadRequestException('A PR cannot depend on itself');
    }

    const dep = await this.prisma.pullRequestDependency.upsert({
      where: {
        dependentPrId_dependsOnPrId: {
          dependentPrId: dependentPR.id,
          dependsOnPrId: dependsOnPR.id,
        },
      },
      create: {
        dependentPrId: dependentPR.id,
        dependsOnPrId: dependsOnPR.id,
        repositoryId: repoEntity.id,
      },
      update: {},
    });

    return { ...dep, dependsOnPrNumber: dto.dependsOnPrNumber };
  }

  async removeDependency(
    owner: string,
    repo: string,
    prNumber: number,
    depId: string,
    userId: string,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    await this.prisma.pullRequestDependency.deleteMany({
      where: { id: depId, dependentPrId: pr.id },
    });

    return { success: true };
  }
}
