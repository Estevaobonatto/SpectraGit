import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreateReviewDto, CreateInlineCommentDto } from './dto/create-review.dto';
import { EventsService } from '../../events/events.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reposService: RepositoriesService,
    private readonly eventsService: EventsService,
  ) {}

  async createReview(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    dto: CreateReviewDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const review = await this.prisma.review.create({
      data: {
        pullRequestId: pr.id,
        reviewerId: userId,
        status: dto.status,
        body: dto.body,
      },
      include: {
        reviewer: { select: { username: true, avatarUrl: true } },
      },
    });

    this.eventsService.emit('pr.review', {
      repositoryId: repoEntity.id,
      pullRequestId: pr.id,
      reviewId: review.id,
      reviewerId: userId,
      status: dto.status,
    });

    return review;
  }

  async getReviews(owner: string, repo: string, prNumber: number, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    return this.prisma.review.findMany({
      where: { pullRequestId: pr.id },
      include: {
        reviewer: { select: { username: true, avatarUrl: true } },
        comments: {
          include: { author: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addInlineComment(
    owner: string,
    repo: string,
    prNumber: number,
    reviewId: string,
    userId: string,
    dto: CreateInlineCommentDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const pr = await this.prisma.pullRequest.findUnique({
      where: { repositoryId_number: { repositoryId: repoEntity.id, number: prNumber } },
    });
    if (!pr) throw new NotFoundException('Pull request not found');

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, pullRequestId: pr.id },
    });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.comment.create({
      data: {
        authorId: userId,
        type: CommentType.REVIEW_INLINE,
        pullRequestId: pr.id,
        reviewId: review.id,
        body: dto.body,
        filePath: dto.filePath,
        lineNumber: dto.lineNumber,
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });
  }
}
