import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PRStatus } from '@prisma/client';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import {
  UpdatePullRequestDto,
  MergePullRequestDto,
  CreatePRCommentDto,
} from './dto/update-pull-request.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Pull Requests')
@Controller('repos/:owner/:repo/pulls')
export class PullRequestsController {
  constructor(private readonly prService: PullRequestsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a pull request' })
  async create(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePullRequestDto,
  ) {
    return this.prService.create(owner, repo, user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List pull requests' })
  async findAll(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: PRStatus,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.findAll(owner, repo, pagination, status, user?.sub);
  }

  @Public()
  @Get(':number')
  @ApiOperation({ summary: 'Get pull request by number' })
  async findOne(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.findByNumber(owner, repo, prNumber, user?.sub);
  }

  @Public()
  @Get(':number/diff')
  @ApiOperation({ summary: 'Get PR diff' })
  async getDiff(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.getDiff(owner, repo, prNumber, user?.sub);
  }

  @Put(':number')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a pull request' })
  async update(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePullRequestDto,
  ) {
    return this.prService.update(owner, repo, prNumber, user.sub, dto);
  }

  @Post(':number/close')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a pull request' })
  async close(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.prService.close(owner, repo, prNumber, user.sub);
  }

  @Post(':number/merge')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge a pull request' })
  async merge(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: MergePullRequestDto,
  ) {
    return this.prService.merge(owner, repo, prNumber, user.sub, dto);
  }

  @Post(':number/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to pull request' })
  async addComment(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePRCommentDto,
  ) {
    return this.prService.addComment(owner, repo, prNumber, user.sub, dto);
  }
}
