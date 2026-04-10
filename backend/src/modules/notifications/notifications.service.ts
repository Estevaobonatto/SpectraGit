import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    payloadJson?: Prisma.InputJsonValue;
  }) {
    return this.prisma.notification.create({ data });
  }

  async findAll(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async delete(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id: notificationId } });
    return { message: 'Notification deleted' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async getPreferences(userId: string) {
    const allTypes: NotificationType[] = [
      'ISSUE_CREATED', 'ISSUE_COMMENT',
      'PR_CREATED', 'PR_COMMENT', 'PR_REVIEW', 'PR_MERGED',
      'MENTION', 'REPO_INVITE', 'ORG_INVITE',
    ];

    const saved = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const savedMap = new Map(saved.map((p) => [p.notificationType, p.enabled]));

    return allTypes.map((type) => ({
      notificationType: type,
      enabled: savedMap.has(type) ? savedMap.get(type)! : true,
    }));
  }

  async updatePreferences(
    userId: string,
    preferences: Array<{ notificationType: string; enabled: boolean }>,
  ) {
    const operations = preferences.map((pref) =>
      this.prisma.notificationPreference.upsert({
        where: {
          userId_notificationType: {
            userId,
            notificationType: pref.notificationType as NotificationType,
          },
        },
        update: { enabled: pref.enabled },
        create: {
          userId,
          notificationType: pref.notificationType as NotificationType,
          enabled: pref.enabled,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return this.getPreferences(userId);
  }
}
