import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsController } from './integrations.controller';
import { GitHubService } from './github/github.service';
import { GitHubGhostUserService } from './github/github-ghost-user.service';
import { GitHubRateLimitService } from './github/github-rate-limit.service';
import { GitHubWebhookService } from './github/github-webhook.service';
import { GitHubIncrementalSyncService } from './github/github-incremental-sync.service';
import { GitHubMirrorService } from './github/github-mirror.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    RepositoriesModule,
    BullModule.registerQueue({ name: 'github-import' }),
    BullModule.registerQueue({ name: 'github-sync' }),
  ],
  controllers: [IntegrationsController],
  providers: [
    GitHubService,
    GitHubGhostUserService,
    GitHubRateLimitService,
    GitHubWebhookService,
    GitHubIncrementalSyncService,
    GitHubMirrorService,
  ],
  exports: [
    GitHubService,
    GitHubGhostUserService,
    GitHubRateLimitService,
    GitHubWebhookService,
    GitHubIncrementalSyncService,
    GitHubMirrorService,
  ],
})
export class IntegrationsModule {}
