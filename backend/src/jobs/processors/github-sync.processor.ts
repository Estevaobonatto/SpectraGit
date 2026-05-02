import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GitHubService } from '../../modules/integrations/github/github.service';
import { GitHubIncrementalSyncService } from '../../modules/integrations/github/github-incremental-sync.service';

@Processor('github-sync')
export class GitHubSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(GitHubSyncProcessor.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly incrementalSyncService: GitHubIncrementalSyncService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string; githubRepoFullName: string }>) {
    this.logger.log(`Syncing GitHub repo: ${job.data.githubRepoFullName}`);

    try {
      const token = await this.githubService.getUserGitHubToken(job.data.userId);
      const repository = await this.githubService.findLinkedRepository(
        job.data.userId,
        job.data.githubRepoFullName,
      );

      const result = await this.incrementalSyncService.syncRepository(
        repository.id,
        job.data.userId,
        token,
      );

      this.logger.log(`GitHub sync complete for: ${job.data.githubRepoFullName}`);
      return result;
    } catch (error) {
      this.logger.error(`GitHub sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
