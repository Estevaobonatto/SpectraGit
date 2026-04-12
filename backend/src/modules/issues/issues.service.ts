import { Injectable, NotFoundException } from '@nestjs/common';
import { IssueStatus, CommentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto, CreateIssueCommentDto } from './dto/update-issue.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { EventsService } from '../../events/events.service';

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reposService: RepositoriesService,
    private readonly eventsService: EventsService,
  ) {}

  async create(owner: string, repo: string, userId: string, dto: CreateIssueDto) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const lastIssue = await this.prisma.issue.findFirst({
      where: { repositoryId: repoEntity.id },
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastIssue?.number ?? 0) + 1;

    const issue = await this.prisma.issue.create({
      data: {
        repositoryId: repoEntity.id,
        authorId: userId,
        number: nextNumber,
        title: dto.title,
        body: dto.body,
        assigneeId: dto.assigneeId,
        milestoneId: dto.milestoneId,
        labels: dto.labelIds ? { create: dto.labelIds.map((labelId) => ({ labelId })) } : undefined,
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        assignee: { select: { username: true, avatarUrl: true } },
        labels: { include: { label: true } },
      },
    });

    this.eventsService.emit('issue.created', {
      repositoryId: repoEntity.id,
      issueId: issue.id,
      issueNumber: issue.number,
      title: issue.title,
      authorId: userId,
    });

    return issue;
  }

  async findAll(
    owner: string,
    repo: string,
    pagination: PaginationDto,
    status?: IssueStatus,
    userId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const where = {
      repositoryId: repoEntity.id,
      ...(status ? { status } : {}),
      ...(pagination.search ? { title: { contains: pagination.search, mode: 'insensitive' as const } } : {}),
    };

    const orderBy = { [pagination.sort ?? 'createdAt']: pagination.sortOrder ?? 'desc' };

    const [rawItems, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy,
        include: {
          author: { select: { username: true, avatarUrl: true } },
          assignee: { select: { username: true, avatarUrl: true } },
          labels: { include: { label: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.issue.count({ where }),
    ]);

    const items = rawItems.map((issue) => ({
      ...issue,
      labels: issue.labels.map((il) => il.label),
    }));

    return {
      items,
      total,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      totalPages: Math.ceil(total / (pagination.limit ?? 20)),
    };
  }

  async findByNumber(owner: string, repo: string, issueNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const issue = await this.prisma.issue.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: issueNumber } },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        assignee: { select: { username: true, avatarUrl: true } },
        labels: { include: { label: true } },
        milestone: true,
        comments: {
          where: { type: CommentType.ISSUE },
          include: { author: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!issue) throw new NotFoundException('Issue not found');
    return { ...issue, labels: issue.labels.map((il) => il.label) };
  }

  async update(
    owner: string,
    repo: string,
    issueNumber: number,
    userId: string,
    dto: UpdateIssueDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const issue = await this.prisma.issue.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: issueNumber } },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    const { labelIds, ...updateData } = dto;

    if (labelIds) {
      await this.prisma.issueLabel.deleteMany({ where: { issueId: issue.id } });
      await this.prisma.issueLabel.createMany({
        data: labelIds.map((labelId) => ({ issueId: issue.id, labelId })),
      });
    }

    const updated = await this.prisma.issue.update({
      where: { id: issue.id },
      data: updateData,
      include: {
        author: { select: { username: true, avatarUrl: true } },
        assignee: { select: { username: true, avatarUrl: true } },
        labels: { include: { label: true } },
      },
    });
    return { ...updated, labels: updated.labels.map((il) => il.label) };
  }

  async addComment(
    owner: string,
    repo: string,
    issueNumber: number,
    userId: string,
    dto: CreateIssueCommentDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const issue = await this.prisma.issue.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: issueNumber } },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    const comment = await this.prisma.comment.create({
      data: {
        authorId: userId,
        type: CommentType.ISSUE,
        issueId: issue.id,
        body: dto.body ?? '',
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    this.eventsService.emit('issue.comment', {
      repositoryId: repoEntity.id,
      issueId: issue.id,
      commentId: comment.id,
      authorId: userId,
    });

    return comment;
  }
}
