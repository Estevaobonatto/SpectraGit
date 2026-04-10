import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GitHubService } from '../../modules/integrations/github/github.service';

@Processor('github-sync')
export class GitHubSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(GitHubSyncProcessor.name);

  constructor(private readonly githubService: GitHubService) {
    super();
  }

  async process(job: Job<{ userId: string; githubRepoFullName: string }>) {
    this.logger.log(`Syncing GitHub repo: ${job.data.githubRepoFullName}`);

    try {
      const result = await this.githubService.syncRepositoryMetadata(
        job.data.userId,
        job.data.githubRepoFullName,
      );

      this.logger.log(`GitHub sync complete for: ${job.data.githubRepoFullName}`);
      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`GitHub sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
