import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class WatchNotificationListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @OnEvent('issue.created')
  async handleIssueCreated(payload: {
    repositoryId: string;
    issueId: string;
    issueNumber: number;
    title: string;
    authorId: string;
  }) {
    await this.notifyWatchers(
      payload.repositoryId,
      payload.authorId,
      'ISSUE_CREATED',
      `New issue #${payload.issueNumber}: ${payload.title}`,
      {
        repositoryId: payload.repositoryId,
        issueId: payload.issueId,
        issueNumber: payload.issueNumber,
      },
    );
  }

  @OnEvent('pr.created')
  async handlePRCreated(payload: {
    repositoryId: string;
    pullRequestId: string;
    prNumber: number;
    title: string;
    authorId: string;
  }) {
    await this.notifyWatchers(
      payload.repositoryId,
      payload.authorId,
      'PR_CREATED',
      `New pull request #${payload.prNumber}: ${payload.title}`,
      {
        repositoryId: payload.repositoryId,
        pullRequestId: payload.pullRequestId,
        prNumber: payload.prNumber,
      },
    );
  }

  private async notifyWatchers(
    repositoryId: string,
    authorId: string,
    type: 'ISSUE_CREATED' | 'PR_CREATED',
    title: string,
    payloadJson: Prisma.InputJsonValue,
  ) {
    const watchers = await this.prisma.repositoryWatch.findMany({
      where: { repositoryId, userId: { not: authorId } },
      select: { userId: true },
    });

    await Promise.all(
      watchers.map(async ({ userId }) => {
        const notification = await this.notificationsService.create({
          userId,
          type,
          title,
          payloadJson,
        });
        this.notificationsGateway.sendToUser(userId, 'notification', notification);
      }),
    );
  }
}
