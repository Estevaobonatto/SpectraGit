import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { ReleasesService } from './releases.service';
import { CreateReleaseDto } from './dto/create-release.dto';
import { UpdateReleaseDto } from './dto/update-release.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';
import * as fs from 'fs';

@ApiTags('Releases')
@Controller('repos/:owner/:repo/releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List releases' })
  async list(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.releasesService.list(owner, repo, user?.sub);
  }

  @Public()
  @Get(':releaseId')
  @ApiOperation({ summary: 'Get release details' })
  async get(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('releaseId') releaseId: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.releasesService.get(owner, repo, releaseId, user?.sub);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a release' })
  async create(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReleaseDto,
  ) {
    return this.releasesService.create(owner, repo, user.sub, dto);
  }

  @Put(':releaseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a release' })
  async update(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('releaseId') releaseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReleaseDto,
  ) {
    return this.releasesService.update(owner, repo, releaseId, user.sub, dto);
  }

  @Delete(':releaseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a release' })
  async delete(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('releaseId') releaseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.releasesService.delete(owner, repo, releaseId, user.sub);
  }

  // ─── Assets ──────────────────────────────────────────────────

  @Post(':releaseId/assets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload assets to a release' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadAssets(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('releaseId') releaseId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 })], // 100MB per file
        fileIsRequired: true,
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return this.releasesService.uploadAssets(owner, repo, releaseId, user.sub, files);
  }

  @Public()
  @Get(':releaseId/assets/:assetId/download')
  @ApiOperation({ summary: 'Download a release asset' })
  async downloadAsset(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('releaseId') releaseId: string,
    @Param('assetId') assetId: string,
    @Res() res: Response,
    @CurrentUser() user?: JwtPayload,
  ) {
    const asset = await this.releasesService.getAsset(owner, repo, releaseId, assetId, user?.sub);
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(asset.fileName)}"`);
    res.setHeader('Content-Length', String(asset.size));
    const stream = fs.createReadStream(asset.filePath);
    stream.pipe(res);
  }

  @Delete(':releaseId/assets/:assetId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a release asset' })
  async deleteAsset(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('releaseId') releaseId: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.releasesService.deleteAsset(owner, repo, releaseId, assetId, user.sub);
  }
}
