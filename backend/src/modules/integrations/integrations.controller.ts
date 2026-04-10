import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GitHubService } from './github/github.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/github')
export class IntegrationsController {
  constructor(
    private readonly githubService: GitHubService,
    @InjectQueue('github-import') private readonly importQueue: Queue,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get linked GitHub profile' })
  async getGitHubProfile(@CurrentUser() user: JwtPayload) {
    return this.githubService.getGitHubProfile(user.sub);
  }

  @Get('repos')
  @ApiOperation({ summary: 'List GitHub repositories' })
  async listRepos(@CurrentUser() user: JwtPayload) {
    return this.githubService.listGitHubRepos(user.sub);
  }

  @Post('repos/:owner/:repo/import')
  @ApiOperation({ summary: 'Import a GitHub repository (async with progress)' })
  async importRepo(
    @CurrentUser() user: JwtPayload,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    const result = await this.githubService.initiateImport(user.sub, `${owner}/${repo}`);

    // If there's a jobId and it's not already imported, enqueue the BullMQ job
    if (result.jobId && !(result as Record<string, unknown>).alreadyRunning) {
      await this.importQueue.add('import', {
        jobId: result.jobId,
        userId: user.sub,
        githubRepoFullName: `${owner}/${repo}`,
      }, {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
      });
    }

    return result;
  }

  @Get('import/:jobId/status')
  @ApiOperation({ summary: 'Get import job progress' })
  async getImportStatus(@Param('jobId') jobId: string) {
    return this.githubService.getImportStatus(jobId);
  }

  @Get('repos/:owner/:repo/sync')
  @ApiOperation({ summary: 'Sync repository metadata from GitHub' })
  async syncRepo(
    @CurrentUser() user: JwtPayload,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    return this.githubService.syncRepositoryMetadata(user.sub, `${owner}/${repo}`);
  }
}
