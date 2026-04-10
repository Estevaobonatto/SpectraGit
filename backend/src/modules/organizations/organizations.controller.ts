import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  CreateTeamDto,
} from './dto/create-organization.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Organizations')
@Controller('orgs')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create organization' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(user.sub, dto);
  }

  @Public()
  @Get(':name')
  @ApiOperation({ summary: 'Get organization by name' })
  async findByName(@Param('name') name: string) {
    return this.orgsService.findByName(name);
  }

  @Put(':name')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('name') name: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgsService.update(name, user.sub, dto);
  }

  @Delete(':name')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete organization' })
  async delete(@Param('name') name: string, @CurrentUser() user: JwtPayload) {
    return this.orgsService.delete(name, user.sub);
  }

  @Post(':name/members')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite member to organization' })
  async inviteMember(
    @Param('name') name: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteMemberDto,
  ) {
    return this.orgsService.inviteMember(name, user.sub, dto);
  }

  @Delete(':name/members/:username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove member from organization' })
  async removeMember(
    @Param('name') name: string,
    @Param('username') username: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orgsService.removeMember(name, user.sub, username);
  }

  @Post(':name/teams')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create team in organization' })
  async createTeam(
    @Param('name') name: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTeamDto,
  ) {
    return this.orgsService.createTeam(name, user.sub, dto);
  }

  @Public()
  @Get(':name/teams')
  @ApiOperation({ summary: 'List teams in organization' })
  async listTeams(@Param('name') name: string) {
    return this.orgsService.listTeams(name);
  }

  @Get('user/memberships')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organizations for current user' })
  async getUserOrganizations(@CurrentUser() user: JwtPayload) {
    return this.orgsService.getUserOrganizations(user.sub);
  }
}
