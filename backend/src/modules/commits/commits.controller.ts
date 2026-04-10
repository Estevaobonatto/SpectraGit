import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommitsService } from './commits.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Commits')
@Controller('repos/:owner/:repo')
export class CommitsController {
  constructor(private readonly commitsService: CommitsService) {}

  @Public()
  @Get('commits')
  @ApiOperation({ summary: 'List commits for a branch' })
  async listCommits(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('branch') branch: string = 'main',
    @Query('limit') limit: number = 30,
    @Query('offset') offset: number = 0,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commitsService.getCommitsByBranch(owner, repo, branch, limit, offset, user?.sub);
  }

  @Public()
  @Get('commits/:sha')
  @ApiOperation({ summary: 'Get commit detail' })
  async getCommit(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('sha') sha: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commitsService.getCommitDetail(owner, repo, sha, user?.sub);
  }

  @Public()
  @Get('commits/:sha/diff')
  @ApiOperation({ summary: 'Get commit diff' })
  async getCommitDiff(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('sha') sha: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commitsService.getCommitDiff(owner, repo, sha, user?.sub);
  }

  @Public()
  @Get('compare/:base...:head')
  @ApiOperation({ summary: 'Compare two branches or commits' })
  async compare(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('base') base: string,
    @Param('head') head: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commitsService.compareBranches(owner, repo, base, head, user?.sub);
  }
}
