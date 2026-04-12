import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { IssueAnalysisService } from './issue-analysis.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { EventsModule } from '../../events/events.module';

@Module({
  imports: [RepositoriesModule, EventsModule],
  controllers: [IssuesController],
  providers: [IssuesService, IssueAnalysisService],
  exports: [IssuesService, IssueAnalysisService],
})
export class IssuesModule {}
