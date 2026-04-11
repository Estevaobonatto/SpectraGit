import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GitReconciliationProcessor } from './processors/git-reconciliation.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { GitHubSyncProcessor } from './processors/github-sync.processor';
import { GitHubImportProcessor } from './processors/github-import.processor';
import { GitModule } from '../modules/git/git.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { IntegrationsModule } from '../modules/integrations/integrations.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'git-reconciliation' },
      { name: 'notifications' },
      { name: 'github-sync' },
      { name: 'github-import' },
    ),
    GitModule,
    NotificationsModule,
    IntegrationsModule,
    PrismaModule,
  ],
  providers: [
    GitReconciliationProcessor,
    NotificationProcessor,
    GitHubSyncProcessor,
    GitHubImportProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
