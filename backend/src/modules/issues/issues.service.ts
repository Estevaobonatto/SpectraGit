import { Injectable, NotFoundException } from '@nestjs/common';
import { IssueStatus, CommentType, IssueType, Prisma, IssuePriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto, CreateIssueCommentDto } from './dto/update-issue.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { EventsService } from '../../events/events.service';
import { IssueAnalysisService } from './issue-analysis.service';

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reposService: RepositoriesService,
    private readonly eventsService: EventsService,
    private readonly analysisService: IssueAnalysisService,
  ) {}

  async create(owner: string, repo: string, userId: string, dto: CreateIssueDto) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const lastIssue = await this.prisma.issue.findFirst({
      where: { repositoryId: repoEntity.id },
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastIssue?.number ?? 0) + 1;

    // Auto-analysis: classify, prioritize, route
    const classification = this.analysisService.classifyIssue(dto.title, dto.body);
    const resolvedType = dto.type ?? classification.type;
    const prioritySuggestion = this.analysisService.suggestPriority(
      dto.title,
      dto.body,
      resolvedType,
    );
    const resolvedPriority = dto.priority ?? prioritySuggestion.priority;
    const assignedArea = this.analysisService.routeToArea(dto.title, dto.body);

    // Determine trust level for initial status
    const trustLevel = await this.analysisService.getUserTrustLevel(userId, repoEntity.id);
    const initialStatus = trustLevel === 'trusted' ? IssueStatus.OPEN : IssueStatus.TRIAGE;

    // Auto-create labels based on type
    const suggestedLabelNames = this.analysisService.suggestLabels(
      resolvedType,
      dto.title,
      dto.body,
    );
    const autoLabelIds = await this.analysisService.ensureTypeLabels(
      repoEntity.id,
      suggestedLabelNames,
      resolvedType,
    );
    const allLabelIds = [...new Set([...autoLabelIds, ...(dto.labelIds ?? [])])];

    const issue = await this.prisma.issue.create({
      data: {
        repositoryId: repoEntity.id,
        authorId: userId,
        number: nextNumber,
        title: dto.title,
        body: dto.body,
        status: initialStatus,
        type: resolvedType,
        priority: resolvedPriority,
        assignedArea: assignedArea,
        techContext:
          dto.techContext != null ? (dto.techContext as Prisma.InputJsonValue) : undefined,
        formData: dto.formData != null ? (dto.formData as Prisma.InputJsonValue) : undefined,
        assigneeId: dto.assigneeId,
        milestoneId: dto.milestoneId,
        labels:
          allLabelIds.length > 0
            ? { create: allLabelIds.map((labelId) => ({ labelId })) }
            : undefined,
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

    const issueWithLabels = issue as typeof issue & { labels: { label: unknown }[] };
    return { ...issue, labels: issueWithLabels.labels.map((il) => il.label) };
  }

  async findAll(
    owner: string,
    repo: string,
    pagination: PaginationDto,
    filters?: {
      status?: IssueStatus | IssueStatus[];
      type?: IssueType;
      priority?: IssuePriority;
      assignedArea?: string;
    },
    userId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const statusFilter = filters?.status
      ? Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status
      : undefined;

    const where = {
      repositoryId: repoEntity.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.priority ? { priority: filters.priority } : {}),
      ...(filters?.assignedArea ? { assignedArea: filters.assignedArea } : {}),
      ...(pagination.search
        ? { title: { contains: pagination.search, mode: 'insensitive' as const } }
        : {}),
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

    // If closing with a reason, ensure close fields are set
    const closeStatuses: IssueStatus[] = [
      IssueStatus.CLOSED,
      IssueStatus.RESOLVED,
      IssueStatus.WONT_FIX,
    ];
    if (updateData.status && closeStatuses.includes(updateData.status)) {
      this.eventsService.emit('issue.closed', {
        repositoryId: repoEntity.id,
        issueId: issue.id,
        issueNumber: issue.number,
        closeReason: updateData.closeReason,
        closedBy: userId,
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

  // ─── New: Analyze issue before creation ────────────────────

  async analyzeIssue(
    owner: string,
    repo: string,
    userId: string,
    title: string,
    body?: string,
    type?: IssueType,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.analysisService.analyze(repoEntity.id, userId, title, body, type);
  }

  // ─── New: Find similar issues ──────────────────────────────

  async findSimilar(
    owner: string,
    repo: string,
    query: string,
    userId?: string,
  ): Promise<import('./issue-analysis.service').DuplicateCandidate[]> {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.analysisService.detectDuplicates(repoEntity.id, query);
  }

  // ─── New: Triage queue ─────────────────────────────────────

  async findTriageQueue(owner: string, repo: string, pagination: PaginationDto, userId?: string) {
    return this.findAll(
      owner,
      repo,
      pagination,
      {
        status: [IssueStatus.TRIAGE, IssueStatus.OPEN],
      },
      userId,
    );
  }

  // ─── New: Kanban board data ────────────────────────────────

  async getKanbanData(owner: string, repo: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const columns: Record<string, IssueStatus[]> = {
      triage: [IssueStatus.TRIAGE],
      open: [IssueStatus.OPEN],
      confirmed: [IssueStatus.CONFIRMED],
      in_progress: [IssueStatus.IN_PROGRESS],
      blocked: [IssueStatus.BLOCKED],
      waiting_user: [IssueStatus.WAITING_USER],
      done: [IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.WONT_FIX],
    };

    const result: Record<string, unknown[]> = {};

    for (const [columnKey, statuses] of Object.entries(columns)) {
      const issues = await this.prisma.issue.findMany({
        where: {
          repositoryId: repoEntity.id,
          status: { in: statuses },
        },
        include: {
          author: { select: { username: true, avatarUrl: true } },
          assignee: { select: { username: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });

      result[columnKey] = issues.map((issue) => ({
        ...issue,
        labels: issue.labels.map((il) => il.label),
      }));
    }

    return result;
  }
}
