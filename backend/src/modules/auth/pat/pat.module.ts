import { Global, Module } from '@nestjs/common';
import { PatService } from './pat.service';
import { PatController } from './pat.controller';

@Global()
@Module({
  controllers: [PatController],
  providers: [PatService],
  exports: [PatService],
})
export class PatModule {}
