import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  CreateTeamDto,
} from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Organization name already taken');

    return this.prisma.organization.create({
      data: {
        ...dto,
        members: {
          create: { userId, role: OrgRole.OWNER },
        },
      },
      include: {
        members: { include: { user: { select: { username: true, avatarUrl: true } } } },
      },
    });
  }

  async findByName(name: string) {
    const org = await this.prisma.organization.findUnique({
      where: { name },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
        teams: true,
        _count: { select: { repositories: true, members: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(name: string, userId: string, dto: UpdateOrganizationDto) {
    await this.ensureOrgAdmin(name, userId);

    return this.prisma.organization.update({
      where: { name },
      data: dto,
    });
  }

  async delete(name: string, userId: string) {
    await this.ensureOrgOwner(name, userId);

    await this.prisma.organization.delete({ where: { name } });
    return { message: 'Organization deleted' };
  }

  async inviteMember(name: string, userId: string, dto: InviteMemberDto) {
    await this.ensureOrgAdmin(name, userId);

    const org = await this.prisma.organization.findUnique({ where: { name } });
    if (!org) throw new NotFoundException('Organization not found');

    const targetUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const existingMember = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: targetUser.id } },
    });
    if (existingMember) throw new ConflictException('User is already a member');

    return this.prisma.organizationMember.create({
      data: {
        orgId: org.id,
        userId: targetUser.id,
        role: dto.role || OrgRole.MEMBER,
      },
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
  }

  async removeMember(name: string, userId: string, memberUsername: string) {
    await this.ensureOrgAdmin(name, userId);

    const org = await this.prisma.organization.findUnique({ where: { name } });
    if (!org) throw new NotFoundException('Organization not found');

    const targetUser = await this.prisma.user.findUnique({
      where: { username: memberUsername },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const membership = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: targetUser.id } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove organization owner');
    }

    await this.prisma.organizationMember.delete({
      where: { orgId_userId: { orgId: org.id, userId: targetUser.id } },
    });
    return { message: 'Member removed' };
  }

  async createTeam(name: string, userId: string, dto: CreateTeamDto) {
    await this.ensureOrgAdmin(name, userId);

    const org = await this.prisma.organization.findUnique({ where: { name } });
    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.team.create({
      data: {
        orgId: org.id,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async listTeams(name: string) {
    const org = await this.prisma.organization.findUnique({ where: { name } });
    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.team.findMany({
      where: { orgId: org.id },
      include: {
        _count: { select: { members: true, repoAccess: true } },
      },
    });
  }

  async addTeamMember(name: string, teamId: string, userId: string, memberId: string) {
    await this.ensureOrgAdmin(name, userId);
    return this.prisma.teamMember.create({
      data: { teamId, userId: memberId },
    });
  }

  async removeTeamMember(name: string, teamId: string, userId: string, memberId: string) {
    await this.ensureOrgAdmin(name, userId);
    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberId } },
    });
    return { message: 'Team member removed' };
  }

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: { _count: { select: { repositories: true, members: true } } },
        },
      },
    });
    return memberships.map((m) => ({ ...m.organization, role: m.role }));
  }

  private async ensureOrgAdmin(name: string, userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { name } });
    if (!org) throw new NotFoundException('Organization not found');

    const membership = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId } },
    });

    if (!membership || (membership.role !== OrgRole.OWNER && membership.role !== OrgRole.ADMIN)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async ensureOrgOwner(name: string, userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { name } });
    if (!org) throw new NotFoundException('Organization not found');

    const membership = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId } },
    });

    if (!membership || membership.role !== OrgRole.OWNER) {
      throw new ForbiddenException('Only the owner can perform this action');
    }
  }
}
