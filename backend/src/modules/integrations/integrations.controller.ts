import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GitHubService } from './github/github.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/github')
export class IntegrationsController {
  constructor(private readonly githubService: GitHubService) {}

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

  @Post('repos/:fullName/import')
  @ApiOperation({ summary: 'Import a GitHub repository' })
  async importRepo(@CurrentUser() user: JwtPayload, @Param('fullName') fullName: string) {
    return this.githubService.importRepository(user.sub, fullName);
  }

  @Get('repos/:fullName/sync')
  @ApiOperation({ summary: 'Sync repository metadata from GitHub' })
  async syncRepo(@CurrentUser() user: JwtPayload, @Param('fullName') fullName: string) {
    return this.githubService.syncRepositoryMetadata(user.sub, fullName);
  }
}
