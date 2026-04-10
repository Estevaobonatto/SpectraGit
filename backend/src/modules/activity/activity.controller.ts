import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Activity')
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Public()
  @Get('repos/:owner/:repo/activity')
  @ApiOperation({ summary: 'List repository activity events' })
  async getRepoActivity(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('limit') limit: number = 30,
    @Query('offset') offset: number = 0,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.activityService.listForRepo(owner, repo, limit, offset, user?.sub);
  }

  @Public()
  @Get('users/:username/activity')
  @ApiOperation({ summary: 'List user activity events' })
  async getUserActivity(
    @Param('username') username: string,
    @Query('limit') limit: number = 30,
    @Query('offset') offset: number = 0,
  ) {
    return this.activityService.listForUser(username, limit, offset);
  }
}
