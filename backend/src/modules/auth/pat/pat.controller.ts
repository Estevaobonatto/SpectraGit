import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatService } from './pat.service';
import { CreatePatDto } from './create-pat.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/types/request.types';

@ApiTags('Personal Access Tokens')
@ApiBearerAuth()
@Controller('user/tokens')
export class PatController {
  constructor(private readonly patService: PatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a personal access token' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePatDto) {
    return this.patService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List personal access tokens' })
  async list(@CurrentUser() user: JwtPayload) {
    return this.patService.list(user.sub);
  }

  @Delete(':tokenId')
  @ApiOperation({ summary: 'Revoke a personal access token' })
  async revoke(@CurrentUser() user: JwtPayload, @Param('tokenId') tokenId: string) {
    return this.patService.revoke(user.sub, tokenId);
  }
}
