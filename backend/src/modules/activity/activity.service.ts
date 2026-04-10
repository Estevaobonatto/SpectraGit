import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reposService: RepositoriesService,
  ) {}

  /**
   * Record an activity event for a repository.
   */
  async record(data: {
    repositoryId?: string;
    actorId: string;
    type: ActivityType;
    ref?: string;
    beforeSha?: string;
    afterSha?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.activityEvent.create({
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * List activity events for a repository (paginated).
   */
  async listForRepo(
    owner: string,
    repo: string,
    limit: number = 30,
    offset: number = 0,
    userId?: string,
  ) {
    const repository = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const [items, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where: { repositoryId: repository.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.activityEvent.count({
        where: { repositoryId: repository.id },
      }),
    ]);

    return { items, total };
  }

  /**
   * List activity events for a user (their profile activity feed).
   */
  async listForUser(username: string, limit: number = 30, offset: number = 0) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return { items: [], total: 0 };

    const [items, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where: { actorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          repository: {
            select: {
              id: true,
              slug: true,
              name: true,
              ownerUser: { select: { username: true } },
              ownerOrg: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.activityEvent.count({ where: { actorId: user.id } }),
    ]);

    return { items, total };
  }
}
