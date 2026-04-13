import { Module } from '@nestjs/common';
import { WikiController } from './wiki.controller';
import { WikiService } from './wiki.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [RepositoriesModule, ActivityModule],
  controllers: [WikiController],
  providers: [WikiService],
  exports: [WikiService],
})
export class WikiModule {}
