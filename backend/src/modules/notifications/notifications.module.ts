import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { WatchNotificationListener } from './watch-notification.listener';

@Module({
  imports: [JwtModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, WatchNotificationListener],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
