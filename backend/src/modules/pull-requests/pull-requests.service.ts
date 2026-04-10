import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PRStatus, MergeStrategy, CommentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import {
  UpdatePullRequestDto,
  MergePullRequestDto,
  CreatePRCommentDto,
} from './dto/update-pull-request.dto';
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
    };

    const [items, total] = await Promise.all([
      this.prisma.pullRequest.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { username: true, avatarUrl: true } },
          _count: { select: { reviews: true, comments: true } },
        },
      }),
      this.prisma.pullRequest.count({ where }),
    ]);

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
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          where: { type: CommentType.PULL_REQUEST },
          include: { author: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        labels: { include: { label: true } },
      },
    });

    if (!pr) throw new NotFoundException('Pull request not found');
    return pr;
  }

  async getDiff(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const diff = await this.gitService.getDiffBetween(
      owner,
      repo,
      pr.targetBranch,
      pr.sourceBranch,
    );
    return { diff, sourceBranch: pr.sourceBranch, targetBranch: pr.targetBranch };
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

    return this.prisma.pullRequest.update({
      where: { id: pr.id },
      data: dto,
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
}
