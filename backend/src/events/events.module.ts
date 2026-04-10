import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsService } from './events.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
