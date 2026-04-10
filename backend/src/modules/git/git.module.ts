import { Global, Module } from '@nestjs/common';
import { GitService } from './git.service';

@Global()
@Module({
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}
