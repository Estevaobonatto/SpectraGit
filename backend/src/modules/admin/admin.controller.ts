import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemAdminGuard } from './guards/system-admin.guard';
import { SelfHostedGuard } from './guards/self-hosted.guard';
import { AdminService } from './admin.service';
import { UpdateInstanceSettingsDto } from './dto/update-instance-settings.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(SelfHostedGuard, JwtAuthGuard, SystemAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Instance Settings ────────────────────────────────────

  @Get('instance/settings')
  @ApiOperation({ summary: 'Get instance-level settings' })
  async getInstanceSettings() {
    return this.adminService.getInstanceSettings();
  }

  @Put('instance/settings')
  @ApiOperation({ summary: 'Update instance-level settings' })
  async updateInstanceSettings(@Body() dto: UpdateInstanceSettingsDto) {
    return this.adminService.updateInstanceSettings(dto);
  }

  // ─── System Health ────────────────────────────────────────

  @Get('instance/health')
  @ApiOperation({ summary: 'Get system health status' })
  async getHealth() {
    return this.adminService.getHealth();
  }

  // ─── User Management ─────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  async listUsers(@Query('page') page = '1', @Query('limit') limit = '25') {
    return this.adminService.listUsers(
      Math.max(1, parseInt(page, 10)),
      Math.min(100, Math.max(1, parseInt(limit, 10))),
    );
  }

  @Patch('users/:userId')
  @ApiOperation({ summary: 'Update a user (systemRole, isDisabled)' })
  async updateUser(@Param('userId') userId: string, @Body() dto: UpdateUserAdminDto) {
    return this.adminService.updateUser(userId, dto);
  }
}
