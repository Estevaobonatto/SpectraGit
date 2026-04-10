import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { GitHubService } from './github/github.service';

@Module({
  controllers: [IntegrationsController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class IntegrationsModule {}
