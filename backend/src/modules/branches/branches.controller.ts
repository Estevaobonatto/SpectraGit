import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Branches')
@Controller('repos/:owner/:repo/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List branches' })
  async list(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.branchesService.list(owner, repo, user?.sub);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a branch' })
  async create(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(owner, repo, user.sub, dto);
  }

  @Delete(':branch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a branch' })
  async delete(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.branchesService.delete(owner, repo, branch, user.sub);
  }
}
