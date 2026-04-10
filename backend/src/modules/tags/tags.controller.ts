import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Tags')
@Controller('repos/:owner/:repo/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List tags' })
  async list(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.tagsService.list(owner, repo, user?.sub);
  }

  @Public()
  @Get(':tag')
  @ApiOperation({ summary: 'Get tag details' })
  async get(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('tag') tag: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.tagsService.get(owner, repo, tag, user?.sub);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a tag' })
  async create(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.create(owner, repo, user.sub, dto);
  }

  @Delete(':tag')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag' })
  async delete(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('tag') tag: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tagsService.delete(owner, repo, tag, user.sub);
  }
}
