import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { RepositoriesService } from './repositories.service';
import { GitService } from '../git/git.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Repositories')
@Controller('repos')
export class RepositoriesController {
  constructor(
    private readonly reposService: RepositoriesService,
    private readonly gitService: GitService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new repository' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRepositoryDto) {
    return this.reposService.create(user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List repositories' })
  async findAll(@Query() pagination: PaginationDto, @CurrentUser() user?: JwtPayload) {
    return this.reposService.findAll(user?.sub || null, pagination);
  }

  @Public()
  @Get(':owner/:repo')
  @ApiOperation({ summary: 'Get repository by owner and name' })
  async findOne(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.reposService.findByOwnerAndSlug(owner, repo, user?.sub);
  }

  @Put(':owner/:repo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update repository settings' })
  async update(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRepositoryDto,
  ) {
    return this.reposService.update(owner, repo, user.sub, dto);
  }

  @Delete(':owner/:repo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete repository' })
  async delete(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.delete(owner, repo, user.sub);
  }

  @Post(':owner/:repo/fork')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fork a repository' })
  async fork(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.fork(owner, repo, user.sub);
  }

  @Public()
  @Get(':owner/:repo/stats')
  @ApiOperation({ summary: 'Get repository stats (languages, contributors, counts)' })
  async getStats(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.reposService.getStats(owner, repo, user?.sub);
  }

  @Public()
  @Get(':owner/:repo/tree/:branch')
  @ApiOperation({ summary: 'Get file tree for a branch' })
  async getFileTree(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @Query('path') dirPath?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.reposService.getFileTree(owner, repo, branch, dirPath, user?.sub);
  }

  @Public()
  @Get(':owner/:repo/blob/:branch/*')
  @ApiOperation({ summary: 'Get file content' })
  async getFileContent(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @Param('0') filePath: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const content = await this.reposService.getFileContent(
      owner,
      repo,
      branch,
      filePath,
      user?.sub,
    );
    const name = filePath.split('/').pop() || filePath;
    const size = await this.gitService.getFileSize(owner, repo, branch, filePath);
    return { content, path: filePath, name, size };
  }

  @Public()
  @Get(':owner/:repo/raw/:branch/*')
  @ApiOperation({ summary: 'Get raw binary file content' })
  async getRawFile(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @Param('0') filePath: string,
    @Res() res: Response,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Access check (throws if not found / unauthorized)
    await this.reposService.getFileContent(owner, repo, branch, filePath, user?.sub);

    const buffer = await this.gitService.getFileBinary(owner, repo, branch, filePath);
    const name = filePath.split('/').pop() || filePath;
    const ext = name.split('.').pop()?.toLowerCase() || '';

    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(buffer);
  }
}
