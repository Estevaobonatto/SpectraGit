import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { PRStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import {
  UpdatePullRequestDto,
  MergePullRequestDto,
  CreatePRCommentDto,
} from './dto/update-pull-request.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateContextBlocksDto } from './dto/update-context-blocks.dto';
import { AddReviewerDto } from './dto/add-reviewer.dto';
import { ResolveCommentDto } from './dto/resolve-comment.dto';
import { AddDependencyDto } from './dto/add-dependency.dto';
import { SetLabelsDto } from './dto/set-labels.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

class ListPRsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PRStatus })
  @IsOptional()
  @IsEnum(PRStatus)
  status?: PRStatus;

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
    @Query() query: ListPRsDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.findAll(owner, repo, query, query.status, user?.sub);
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

  // ─── New Endpoints ─────────────────────────────────────────────

  @Public()
  @Get(':number/summary')
  @ApiOperation({ summary: 'Get PR visual summary (stats, risk, review counts)' })
  async getSummary(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.getSummary(owner, repo, prNumber, user?.sub);
  }

  @Public()
  @Get(':number/timeline')
  @ApiOperation({ summary: 'Get PR activity timeline' })
  async getTimeline(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.getTimeline(owner, repo, prNumber, user?.sub);
  }

  @Public()
  @Get(':number/blockers')
  @ApiOperation({ summary: 'Get active blockers preventing merge' })
  async getBlockers(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.prService.getBlockers(owner, repo, prNumber, user?.sub);
  }

  @Put(':number/checklist')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace PR checklist items' })
  async updateChecklist(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.prService.updateChecklist(owner, repo, prNumber, user.sub, dto);
  }

  @Put(':number/context')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update PR context blocks (problem, solution, impact, testing)' })
  async updateContext(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateContextBlocksDto,
  ) {
    return this.prService.updateContextBlocks(owner, repo, prNumber, user.sub, dto);
  }

  @Post(':number/reviewers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a reviewer for the PR' })
  async addReviewer(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddReviewerDto,
  ) {
    return this.prService.addReviewer(owner, repo, prNumber, user.sub, dto);
  }

  @Delete(':number/reviewers/:userId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a requested reviewer from the PR' })
  async removeReviewer(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @Param('userId') reviewerUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.prService.removeReviewer(owner, repo, prNumber, reviewerUserId, user.sub);
  }

  @Patch(':number/comments/:commentId/resolve')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a PR comment as resolved or unresolved' })
  async resolveComment(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ResolveCommentDto,
  ) {
    return this.prService.resolveComment(owner, repo, prNumber, commentId, user.sub, dto);
  }

  @Put(':number/labels')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set labels on a PR (replaces existing)' })
  async setLabels(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetLabelsDto,
  ) {
    return this.prService.setLabels(owner, repo, prNumber, user.sub, dto);
  }

  @Post(':number/dependencies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a dependency: this PR depends on another PR' })
  async addDependency(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddDependencyDto,
  ) {
    return this.prService.addDependency(owner, repo, prNumber, user.sub, dto);
  }

  @Delete(':number/dependencies/:depId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a PR dependency' })
  async removeDependency(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number', ParseIntPipe) prNumber: number,
    @Param('depId') depId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.prService.removeDependency(owner, repo, prNumber, depId, user.sub);
  }
}
