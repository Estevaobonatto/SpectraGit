import { Controller, Get, Post, Put, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssueStatus } from '@prisma/client';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto, CreateIssueCommentDto } from './dto/update-issue.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Issues')
@Controller('repos/:owner/:repo/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an issue' })
  async create(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateIssueDto,
  ) {
    return this.issuesService.create(owner, repo, user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List issues' })
  async findAll(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: IssueStatus,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.issuesService.findAll(owner, repo, pagination, status, user?.sub);
  }

  @Public()
  @Get(':number')
  @ApiOperation({ summary: 'Get issue by number' })
  async findOne(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) issueNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.issuesService.findByNumber(owner, repo, issueNumber, user?.sub);
  }

  @Put(':number')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an issue' })
  async update(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) issueNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.issuesService.update(owner, repo, issueNumber, user.sub, dto);
  }

  @Post(':number/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to an issue' })
  async addComment(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) issueNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateIssueCommentDto,
  ) {
    return this.issuesService.addComment(owner, repo, issueNumber, user.sub, dto);
  }
}
