import { Controller, Get, Post, Put, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus, IssueType, IssuePriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto, CreateIssueCommentDto } from './dto/update-issue.dto';
import { AnalyzeIssueDto } from './dto/analyze-issue.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

class ListIssuesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: IssueType })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedArea?: string;

  // Re-declare inherited string props so class-validator's whitelist
  // picks up the metadata on this subclass prototype (inheritance gap in v0.14)
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'title'])
  sort?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  search?: string;
}

@ApiTags('Issues')
@Controller('repos/:owner/:repo/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post('analyze')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Analyze an issue before creation (duplicates, classification, priority)',
  })
  async analyze(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AnalyzeIssueDto,
  ) {
    return this.issuesService.analyzeIssue(owner, repo, user.sub, dto.title, dto.body, dto.type);
  }

  @Public()
  @Get('similar')
  @ApiOperation({ summary: 'Find similar issues by text query' })
  async findSimilar(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('q') query: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<import('./issue-analysis.service').DuplicateCandidate[]> {
    return this.issuesService.findSimilar(owner, repo, query ?? '', user?.sub);
  }

  @Public()
  @Get('triage')
  @ApiOperation({ summary: 'Get issues in triage queue' })
  async findTriageQueue(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query() query: PaginationDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.issuesService.findTriageQueue(owner, repo, query, user?.sub);
  }

  @Public()
  @Get('kanban')
  @ApiOperation({ summary: 'Get issues grouped by status for kanban board' })
  async getKanban(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.issuesService.getKanbanData(owner, repo, user?.sub);
  }

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
    @Query() query: ListIssuesDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Support comma-separated status for multiple statuses
    const statusFilter = query.status
      ? query.status.includes(',')
        ? (query.status.split(',') as IssueStatus[])
        : (query.status as IssueStatus)
      : undefined;

    return this.issuesService.findAll(
      owner,
      repo,
      query,
      {
        status: statusFilter,
        type: query.type,
        priority: query.priority,
        assignedArea: query.assignedArea,
      },
      user?.sub,
    );
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
