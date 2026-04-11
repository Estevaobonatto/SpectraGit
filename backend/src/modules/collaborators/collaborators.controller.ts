import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollaboratorsService } from './collaborators.service';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { UpdateCollaboratorRoleDto } from './dto/update-collaborator-role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/types/request.types';

@ApiTags('Collaborators')
@Controller('repos/:owner/:repo/collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List repository collaborators' })
  async list(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.collaboratorsService.listCollaborators(owner, repo, user?.sub);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a collaborator to the repository' })
  async add(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.collaboratorsService.addCollaborator(owner, repo, user.sub, dto);
  }

  @Put(':username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a collaborator role' })
  async updateRole(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('username') username: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCollaboratorRoleDto,
  ) {
    return this.collaboratorsService.updateCollaboratorRole(
      owner,
      repo,
      user.sub,
      username,
      dto,
    );
  }

  @Delete(':username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a collaborator from the repository' })
  async remove(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('username') username: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.collaboratorsService.removeCollaborator(owner, repo, user.sub, username);
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users available to add as collaborators' })
  async searchUsers(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('q') query: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.collaboratorsService.searchAvailableUsers(owner, repo, query || '', user.sub);
  }

  @Get('org-members/:orgName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organization members available to add as collaborators' })
  async orgMembers(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('orgName') orgName: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.collaboratorsService.listOrgMembersForRepo(owner, repo, user.sub, orgName);
  }
}

@ApiTags('Collaborators')
@ApiBearerAuth()
@Controller('user/collaborated-repos')
export class CollaboratedReposController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Get()
  @ApiOperation({ summary: 'List repositories where the current user is a collaborator' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.collaboratorsService.listCollaboratedRepositories(user.sub, page, limit);
  }
}
