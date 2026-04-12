import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { RepositoriesService } from './repositories.service';
import { GitService } from '../git/git.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { ForkRepositoryDto } from './dto/fork-repository.dto';
import { ListRepositoriesQueryDto } from './dto/list-repositories-query.dto';
import { UpdateBranchProtectionDto } from './dto/update-branch-protection.dto';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';
import { TransferRepositoryDto } from './dto/transfer-repository.dto';
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
  async findAll(
    @Query() query: ListRepositoriesQueryDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const { scope, q, repoSort, ...pagination } = query;
    return this.reposService.findAll(user?.sub || null, pagination as PaginationDto, scope, q, repoSort);
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
    @Body() dto: ForkRepositoryDto,
  ) {
    return this.reposService.fork(owner, repo, user.sub, dto);
  }

  @Post(':owner/:repo/pulse')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pulse (like) a repository' })
  async pulse(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.pulseRepo(user.sub, owner, repo);
  }

  @Delete(':owner/:repo/pulse')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove pulse from a repository' })
  async unpulse(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.unpulseRepo(user.sub, owner, repo);
  }

  @Post(':owner/:repo/watch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Watch a repository' })
  async watch(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.watchRepo(user.sub, owner, repo);
  }

  @Delete(':owner/:repo/watch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unwatch a repository' })
  async unwatch(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.unwatchRepo(user.sub, owner, repo);
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

  // ─── Branch Protection ─────────────────────────────────────

  @Get(':owner/:repo/branches/:branch/protection')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get branch protection rules' })
  async getBranchProtection(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.getBranchProtection(owner, repo, branch, user.sub);
  }

  @Put(':owner/:repo/branches/:branch/protection')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch protection rules' })
  async updateBranchProtection(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBranchProtectionDto,
  ) {
    return this.reposService.updateBranchProtection(owner, repo, branch, user.sub, dto);
  }

  @Delete(':owner/:repo/branches/:branch/protection')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove branch protection' })
  async removeBranchProtection(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('branch') branch: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.removeBranchProtection(owner, repo, branch, user.sub);
  }

  // ─── Webhooks ──────────────────────────────────────────────

  @Get(':owner/:repo/webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List webhooks' })
  async listWebhooks(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.listWebhooks(owner, repo, user.sub);
  }

  @Post(':owner/:repo/webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a webhook' })
  async createWebhook(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.reposService.createWebhook(owner, repo, user.sub, dto);
  }

  @Put(':owner/:repo/webhooks/:webhookId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a webhook' })
  async updateWebhook(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.reposService.updateWebhook(owner, repo, webhookId, user.sub, dto);
  }

  @Delete(':owner/:repo/webhooks/:webhookId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a webhook' })
  async deleteWebhook(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reposService.deleteWebhook(owner, repo, webhookId, user.sub);
  }

  // ─── Transfer ──────────────────────────────────────────────

  @Post(':owner/:repo/transfer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer repository to another owner' })
  async transferRepository(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: TransferRepositoryDto,
  ) {
    return this.reposService.transferRepository(owner, repo, user.sub, dto);
  }
}
