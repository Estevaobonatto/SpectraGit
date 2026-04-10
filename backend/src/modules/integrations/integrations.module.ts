import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { GitHubService } from './github/github.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [IntegrationsController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class IntegrationsModule {}
