import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { NotificationsGateway } from '../../modules/notifications/notifications.gateway';
import { NotificationType } from '@prisma/client';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    super();
  }

  async process(
    job: Job<{
      userId: string;
      type: NotificationType;
      title: string;
      payloadJson?: Prisma.InputJsonValue;
    }>,
  ) {
    this.logger.log(`Processing notification for user ${job.data.userId}: ${job.data.type}`);

    try {
      const notification = await this.notificationsService.create(job.data);

      // Push real-time via WebSocket if user is online
      this.notificationsGateway.sendToUser(job.data.userId, 'notification', notification);

      return { success: true, notificationId: notification.id };
    } catch (error) {
      this.logger.error(`Notification delivery failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
