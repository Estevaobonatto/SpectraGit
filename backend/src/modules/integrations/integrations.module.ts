import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsController } from './integrations.controller';
import { GitHubService } from './github/github.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule, BullModule.registerQueue({ name: 'github-import' })],
  controllers: [IntegrationsController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class IntegrationsModule {}
