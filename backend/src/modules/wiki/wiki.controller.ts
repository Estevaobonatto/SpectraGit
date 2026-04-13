import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WikiService } from './wiki.service';
import { CreateWikiPageDto } from './dto/create-wiki-page.dto';
import { UpdateWikiPageDto } from './dto/update-wiki-page.dto';
import { UpdateWikiSettingsDto } from './dto/update-wiki-settings.dto';
import { CreateWikiCommentDto } from './dto/create-wiki-comment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Wiki')
@Controller('repos/:owner/:repo/wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  // ─── Settings ────────────────────────────────────────────────

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Get wiki settings' })
  async getSettings(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.wikiService.getSettings(owner, repo, user?.sub);
  }

  @Put('settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update wiki settings (admin only)' })
  async updateSettings(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWikiSettingsDto,
  ) {
    return this.wikiService.updateSettings(owner, repo, user.sub, dto);
  }

  // ─── Pages ───────────────────────────────────────────────────

  @Public()
  @Get('pages')
  @ApiOperation({ summary: 'List all wiki pages' })
  async listPages(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.wikiService.listPages(owner, repo, user?.sub);
  }

  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get a wiki page by slug' })
  async getPage(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.wikiService.getPage(owner, repo, slug, user?.sub);
  }

  @Post('pages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a wiki page' })
  async createPage(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWikiPageDto,
  ) {
    return this.wikiService.createPage(owner, repo, user.sub, dto);
  }

  @Put('pages/:slug')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a wiki page' })
  async updatePage(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWikiPageDto,
  ) {
    return this.wikiService.updatePage(owner, repo, slug, user.sub, dto);
  }

  @Delete('pages/:slug')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a wiki page' })
  async deletePage(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.wikiService.deletePage(owner, repo, slug, user.sub);
  }

  // ─── Versions ────────────────────────────────────────────────

  @Public()
  @Get('pages/:slug/versions')
  @ApiOperation({ summary: 'List page version history' })
  async listVersions(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.wikiService.listVersions(owner, repo, slug, user?.sub);
  }

  @Public()
  @Get('pages/:slug/versions/:version')
  @ApiOperation({ summary: 'Get a specific page version' })
  async getVersion(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.wikiService.getVersion(owner, repo, slug, version, user?.sub);
  }

  @Post('pages/:slug/versions/:version/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a page to a previous version' })
  async restoreVersion(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.wikiService.restoreVersion(owner, repo, slug, version, user.sub);
  }

  // ─── Comments ────────────────────────────────────────────────

  @Public()
  @Get('pages/:slug/comments')
  @ApiOperation({ summary: 'List comments on a wiki page' })
  async listComments(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.wikiService.listComments(owner, repo, slug, user?.sub);
  }

  @Post('pages/:slug/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a wiki page' })
  async createComment(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWikiCommentDto,
  ) {
    return this.wikiService.createComment(owner, repo, slug, user.sub, dto);
  }

  @Delete('comments/:commentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a wiki comment' })
  async deleteComment(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.wikiService.deleteComment(owner, repo, commentId, user.sub);
  }
}
