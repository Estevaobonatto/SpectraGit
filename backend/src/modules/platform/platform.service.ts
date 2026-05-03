import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RepoVisibility } from '@prisma/client';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalRepos,
      totalPublicRepos,
      totalPulses,
      totalWatches,
      totalIssues,
      totalPullRequests,
      todayPulses,
      todayRepos,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.repository.count(),
      this.prisma.repository.count({ where: { visibility: RepoVisibility.PUBLIC } }),
      this.prisma.repositoryPulse.count(),
      this.prisma.repositoryWatch.count(),
      this.prisma.issue.count(),
      this.prisma.pullRequest.count(),
      this.prisma.repositoryPulse.count({
        where: { createdAt: { gte: this.startOfDay() } },
      }),
      this.prisma.repository.count({
        where: { createdAt: { gte: this.startOfDay() } },
      }),
    ]);

    return {
      totalUsers,
      totalRepos,
      totalPublicRepos,
      totalPulses,
      totalWatches,
      totalIssues,
      totalPullRequests,
      todayPulses,
      todayRepos,
    };
  }

  async getGlobalActivity(limit: number = 20) {
    const items = await this.prisma.activityEvent.findMany({
      where: {
        repository: { visibility: RepoVisibility.PUBLIC },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
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
    });

    return items;
  }

  async getPopularTopics(limit: number = 20) {
    const repos = await this.prisma.repository.findMany({
      where: { visibility: RepoVisibility.PUBLIC, topics: { isEmpty: false } },
      select: { topics: true },
    });

    const topicCounts = new Map<string, number>();
    for (const repo of repos) {
      for (const topic of repo.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
      }
    }

    return [...topicCounts.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  async getFeaturedRepositories(limit: number = 6) {
    const repos = await this.prisma.repository.findMany({
      where: { visibility: RepoVisibility.PUBLIC },
      orderBy: [
        { pulses: { _count: 'desc' } },
        { watches: { _count: 'desc' } },
      ],
      take: limit,
      include: {
        ownerUser: { select: { username: true, avatarUrl: true } },
        ownerOrg: { select: { name: true, avatarUrl: true } },
        _count: {
          select: { pulses: true, watches: true, forks: true, issues: true },
        },
      },
    });

    return repos.map((repo) => ({
      ...repo,
      pulseCount: repo._count.pulses,
      watchCount: repo._count.watches,
      forkCount: repo._count.forks,
      issueCount: repo._count.issues,
    }));
  }

  async getTrendingRepositories(timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 10) {
    const since =
      timeframe === 'day'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : timeframe === 'week'
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const repos = await this.prisma.repository.findMany({
      where: { visibility: RepoVisibility.PUBLIC },
      orderBy: [{ pulses: { _count: 'desc' } }, { watches: { _count: 'desc' } }],
      take: limit,
      include: {
        ownerUser: { select: { username: true, avatarUrl: true } },
        ownerOrg: { select: { name: true, avatarUrl: true } },
        _count: {
          select: {
            pulses: { where: { createdAt: { gte: since } } },
            watches: true,
            forks: true,
          },
        },
      },
    });

    return repos.map((repo) => ({
      ...repo,
      pulseCount: repo._count.pulses,
      watchCount: repo._count.watches,
      forkCount: repo._count.forks,
    }));
  }

  private startOfDay(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
