import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { EventsModule } from '../../events/events.module';

@Module({
  imports: [RepositoriesModule, EventsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
