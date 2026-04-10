import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: string, payload: unknown): boolean {
    return this.eventEmitter.emit(event, payload);
  }

  async emitAsync(event: string, payload: unknown): Promise<unknown[]> {
    return this.eventEmitter.emitAsync(event, payload);
  }
}
