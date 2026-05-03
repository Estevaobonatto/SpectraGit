import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
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

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }

  @Get('me/oauth-accounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List connected OAuth accounts' })
  async getOAuthAccounts(@CurrentUser() user: JwtPayload) {
    return this.usersService.getOAuthAccounts(user.sub);
  }

  @Get('me/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user dashboard data' })
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.usersService.getDashboard(user.sub);
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
  @Get('users/popular')
  @ApiOperation({ summary: 'Get most popular users by repo pulse count' })
  async getPopularUsers(@Query('timeframe') timeframe?: string, @Query('limit') limit?: string) {
    const validTimeframes = ['week', 'month', 'all'];
    const tf = validTimeframes.includes(timeframe!)
      ? (timeframe as 'week' | 'month' | 'all')
      : 'week';
    const lim = Math.min(Number(limit) || 20, 50);
    return this.usersService.getMostPopularUsers(tf, lim);
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

  @Post('me/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })], // 5 MB
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.sub, file);
  }

  @Public()
  @Get('avatars/:userId/:filename')
  @ApiOperation({ summary: 'Serve uploaded avatar image' })
  async serveAvatar(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const { stream, contentType } = await this.usersService.getAvatarStream(userId, filename);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.pipe(res);
  }
}
