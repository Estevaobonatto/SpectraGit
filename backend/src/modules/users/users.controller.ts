import { Controller, Get, Put, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateSSHKeyDto } from './dto/ssh-key.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Post('me/ssh-keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add SSH key' })
  async addSSHKey(@CurrentUser() user: JwtPayload, @Body() dto: CreateSSHKeyDto) {
    return this.usersService.createSSHKey(user.sub, dto);
  }

  @Get('me/ssh-keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List SSH keys' })
  async listSSHKeys(@CurrentUser() user: JwtPayload) {
    return this.usersService.listSSHKeys(user.sub);
  }

  @Delete('me/ssh-keys/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete SSH key' })
  async deleteSSHKey(@CurrentUser() user: JwtPayload, @Param('id') keyId: string) {
    return this.usersService.deleteSSHKey(user.sub, keyId);
  }

  @Public()
  @Get('users/:username')
  @ApiOperation({ summary: 'Get user by username' })
  async getByUsername(@Param('username') username: string) {
    return this.usersService.getByUsername(username);
  }

  @Get('users/search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.usersService.searchUsers(query, limit);
  }
}
