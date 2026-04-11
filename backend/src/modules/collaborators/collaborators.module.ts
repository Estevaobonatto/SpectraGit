import { Module } from '@nestjs/common';
import { CollaboratorsController, CollaboratedReposController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CollaboratorsController, CollaboratedReposController],
  providers: [CollaboratorsService],
  exports: [CollaboratorsService],
})
export class CollaboratorsModule {}
