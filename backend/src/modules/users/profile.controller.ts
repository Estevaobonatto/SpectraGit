import { Controller, Get, Put, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileCustomizationDto } from './dto/update-profile-customization.dto';
import { CreateProfileSectionDto, UpdateProfileSectionDto } from './dto/profile-section.dto';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { CreateProfileProjectDto, UpdateProfileProjectDto } from './dto/profile-project.dto';
import { PinRepositoryDto } from './dto/pin-repository.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Profile')
@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ── Public ───────────────────────────────────────────────

  @Public()
  @Get('users/:username/profile')
  @ApiOperation({ summary: 'Get public user profile' })
  async getPublicProfile(@Param('username') username: string) {
    return this.profileService.getPublicProfile(username);
  }

  @Public()
  @Get('users/:username/languages')
  @ApiOperation({ summary: 'Get user language stats' })
  async getLanguageStats(@Param('username') username: string) {
    return this.profileService.getLanguageStats(username);
  }

  @Public()
  @Get('users/:username/heatmap')
  @ApiOperation({ summary: 'Get user commit heatmap' })
  async getCommitHeatmap(
    @Param('username') username: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.profileService.getCommitHeatmap(username, user?.sub);
  }

  // ── Authenticated: My Profile ────────────────────────────

  @Get('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile customization' })
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getMyProfile(user.sub);
  }

  @Put('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile customization' })
  async updateCustomization(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileCustomizationDto,
  ) {
    return this.profileService.updateCustomization(user.sub, dto);
  }

  // ── Sections ─────────────────────────────────────────────

  @Post('me/profile/sections')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create profile section' })
  async createSection(@CurrentUser() user: JwtPayload, @Body() dto: CreateProfileSectionDto) {
    return this.profileService.createSection(user.sub, dto);
  }

  @Put('me/profile/sections/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile section' })
  async updateSection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProfileSectionDto,
  ) {
    return this.profileService.updateSection(user.sub, id, dto);
  }

  @Delete('me/profile/sections/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile section' })
  async deleteSection(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.profileService.deleteSection(user.sub, id);
  }

  // ── Social Links ─────────────────────────────────────────

  @Post('me/profile/social-links')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add social link' })
  async createSocialLink(@CurrentUser() user: JwtPayload, @Body() dto: CreateSocialLinkDto) {
    return this.profileService.createSocialLink(user.sub, dto);
  }

  @Put('me/profile/social-links/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update social link' })
  async updateSocialLink(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSocialLinkDto,
  ) {
    return this.profileService.updateSocialLink(user.sub, id, dto);
  }

  @Delete('me/profile/social-links/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete social link' })
  async deleteSocialLink(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.profileService.deleteSocialLink(user.sub, id);
  }

  // ── Pinned Repos ─────────────────────────────────────────

  @Post('me/profile/pinned-repos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pin a repository' })
  async pinRepository(@CurrentUser() user: JwtPayload, @Body() dto: PinRepositoryDto) {
    return this.profileService.pinRepository(user.sub, dto);
  }

  @Delete('me/profile/pinned-repos/:repositoryId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpin a repository' })
  async unpinRepository(@CurrentUser() user: JwtPayload, @Param('repositoryId') repositoryId: string) {
    return this.profileService.unpinRepository(user.sub, repositoryId);
  }

  // ── Skills ───────────────────────────────────────────────

  @Post('me/profile/skills')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a skill' })
  async createSkill(@CurrentUser() user: JwtPayload, @Body() dto: CreateSkillDto) {
    return this.profileService.createSkill(user.sub, dto);
  }

  @Put('me/profile/skills/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a skill' })
  async updateSkill(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.profileService.updateSkill(user.sub, id, dto);
  }

  @Delete('me/profile/skills/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a skill' })
  async deleteSkill(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.profileService.deleteSkill(user.sub, id);
  }

  // ── Projects ─────────────────────────────────────────────

  @Post('me/profile/projects')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a project' })
  async createProject(@CurrentUser() user: JwtPayload, @Body() dto: CreateProfileProjectDto) {
    return this.profileService.createProject(user.sub, dto);
  }

  @Put('me/profile/projects/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project' })
  async updateProject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProfileProjectDto,
  ) {
    return this.profileService.updateProject(user.sub, id, dto);
  }

  @Delete('me/profile/projects/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a project' })
  async deleteProject(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.profileService.deleteProject(user.sub, id);
  }
}
