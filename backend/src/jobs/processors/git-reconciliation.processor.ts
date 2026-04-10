import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../../modules/git/git.service';

@Processor('git-reconciliation')
export class GitReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(GitReconciliationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
  ) {
    super();
  }

  async process(job: Job<{ repositoryId: string; ownerName: string; repoSlug: string }>) {
    this.logger.log(`Processing git reconciliation for repo: ${job.data.repositoryId}`);

    const { repositoryId, ownerName, repoSlug } = job.data;

    try {
      // Sync branches from disk to DB
      const diskBranches = await this.gitService.getBranches(ownerName, repoSlug);
      const dbBranches = await this.prisma.branch.findMany({
        where: { repositoryId },
        select: { name: true },
      });

      const dbBranchNames = new Set(dbBranches.map((b) => b.name));
      const diskBranchNames = new Set(diskBranches);

      // Add branches that exist on disk but not in DB
      for (const branchName of diskBranches) {
        if (!dbBranchNames.has(branchName)) {
          await this.prisma.branch.create({
            data: {
              repositoryId,
              name: branchName,
            },
          });
          this.logger.log(`Synced branch to DB: ${branchName}`);
        }
      }

      // Remove DB branches not on disk
      for (const branchName of dbBranchNames) {
        if (!diskBranchNames.has(branchName)) {
          await this.prisma.branch.deleteMany({
            where: { repositoryId, name: branchName },
          });
          this.logger.log(`Removed stale branch from DB: ${branchName}`);
        }
      }

      this.logger.log(`Git reconciliation complete for repo: ${repositoryId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Git reconciliation failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
