import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { EventsModule } from '../../events/events.module';

@Module({
  imports: [RepositoriesModule, EventsModule],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
