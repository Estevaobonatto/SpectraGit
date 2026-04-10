import { Module } from '@nestjs/common';
import { PullRequestsController } from './pull-requests.controller';
import { PullRequestsService } from './pull-requests.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { EventsModule } from '../../events/events.module';

@Module({
  imports: [RepositoriesModule, EventsModule],
  controllers: [PullRequestsController],
  providers: [PullRequestsService],
  exports: [PullRequestsService],
})
export class PullRequestsModule {}
