import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RepoRole, RepoVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { UpdateCollaboratorRoleDto } from './dto/update-collaborator-role.dto';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List all collaborators for a repository.
   */
  async listCollaborators(ownerName: string, slug: string, userId?: string) {
    const repo = await this.resolveRepo(ownerName, slug);
    await this.ensureReadAccess(repo, userId);

    const members = await this.prisma.repositoryMember.findMany({
      where: { repositoryId: repo.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  /**
   * Add a collaborator to a repository.
   */
  async addCollaborator(ownerName: string, slug: string, actorId: string, dto: AddCollaboratorDto) {
    const repo = await this.resolveRepo(ownerName, slug);
    await this.ensureManagePermission(repo, actorId);

    // Find the target user
    const targetUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
    if (!targetUser) {
      throw new NotFoundException(`User "${dto.username}" not found`);
    }

    // Cannot add the repo owner as collaborator
    if (repo.ownerUserId === targetUser.id) {
      throw new BadRequestException('Cannot add the repository owner as a collaborator');
    }

    // Check for existing membership
    const existing = await this.prisma.repositoryMember.findUnique({
      where: {
        repositoryId_userId: { repositoryId: repo.id, userId: targetUser.id },
      },
    });
    if (existing) {
      throw new ConflictException('User is already a collaborator');
    }

    const member = await this.prisma.repositoryMember.create({
      data: {
        repositoryId: repo.id,
        userId: targetUser.id,
        role: dto.role || RepoRole.READ,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    // Notify the collaborator
    await this.notificationsService.create({
      userId: targetUser.id,
      type: 'COLLABORATOR_ADDED',
      title: `You were added as a collaborator to ${ownerName}/${slug}`,
      payloadJson: {
        repositoryOwner: ownerName,
        repositorySlug: slug,
        repositoryId: repo.id,
        role: dto.role || RepoRole.READ,
        addedBy: actorId,
      },
    });

    // Audit log
    await this.auditService.log({
      userId: actorId,
      action: 'COLLABORATOR_ADDED',
      resource: 'repository_members',
      resourceId: member.id,
      metadata: {
        repositoryId: repo.id,
        repositorySlug: slug,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        role: dto.role || RepoRole.READ,
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      user: member.user,
    };
  }

  /**
   * Update a collaborator's role.
   */
  async updateCollaboratorRole(
    ownerName: string,
    slug: string,
    actorId: string,
    targetUsername: string,
    dto: UpdateCollaboratorRoleDto,
  ) {
    const repo = await this.resolveRepo(ownerName, slug);
    await this.ensureManagePermission(repo, actorId);

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true },
    });
    if (!targetUser) {
      throw new NotFoundException(`User "${targetUsername}" not found`);
    }

    const member = await this.prisma.repositoryMember.findUnique({
      where: {
        repositoryId_userId: { repositoryId: repo.id, userId: targetUser.id },
      },
    });
    if (!member) {
      throw new NotFoundException('Collaborator not found');
    }

    const oldRole = member.role;

    const updated = await this.prisma.repositoryMember.update({
      where: { id: member.id },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    // Notify the collaborator about role change
    await this.notificationsService.create({
      userId: targetUser.id,
      type: 'COLLABORATOR_ROLE_CHANGED',
      title: `Your role in ${ownerName}/${slug} was changed to ${dto.role}`,
      payloadJson: {
        repositoryOwner: ownerName,
        repositorySlug: slug,
        repositoryId: repo.id,
        oldRole,
        newRole: dto.role,
        changedBy: actorId,
      },
    });

    // Audit log
    await this.auditService.log({
      userId: actorId,
      action: 'COLLABORATOR_ROLE_CHANGED',
      resource: 'repository_members',
      resourceId: member.id,
      metadata: {
        repositoryId: repo.id,
        repositorySlug: slug,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        oldRole,
        newRole: dto.role,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      createdAt: updated.createdAt,
      user: updated.user,
    };
  }

  /**
   * Remove a collaborator from a repository.
   */
  async removeCollaborator(
    ownerName: string,
    slug: string,
    actorId: string,
    targetUsername: string,
  ) {
    const repo = await this.resolveRepo(ownerName, slug);
    await this.ensureManagePermission(repo, actorId);

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true },
    });
    if (!targetUser) {
      throw new NotFoundException(`User "${targetUsername}" not found`);
    }

    const member = await this.prisma.repositoryMember.findUnique({
      where: {
        repositoryId_userId: { repositoryId: repo.id, userId: targetUser.id },
      },
    });
    if (!member) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.prisma.repositoryMember.delete({ where: { id: member.id } });

    // Notify the collaborator about removal
    await this.notificationsService.create({
      userId: targetUser.id,
      type: 'COLLABORATOR_REMOVED',
      title: `You were removed from ${ownerName}/${slug}`,
      payloadJson: {
        repositoryOwner: ownerName,
        repositorySlug: slug,
        repositoryId: repo.id,
        removedBy: actorId,
      },
    });

    // Audit log
    await this.auditService.log({
      userId: actorId,
      action: 'COLLABORATOR_REMOVED',
      resource: 'repository_members',
      resourceId: member.id,
      metadata: {
        repositoryId: repo.id,
        repositorySlug: slug,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
      },
    });

    return { message: 'Collaborator removed' };
  }

  /**
   * List repositories where the user is a collaborator (not owner).
   */
  async listCollaboratedRepositories(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.repositoryMember.findMany({
        where: { userId },
        include: {
          repository: {
            include: {
              ownerUser: { select: { username: true, avatarUrl: true } },
              ownerOrg: { select: { name: true, avatarUrl: true } },
              _count: { select: { issues: true, pullRequests: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.repositoryMember.count({ where: { userId } }),
    ]);

    return {
      items: items.map((m) => ({
        ...m.repository,
        collaboratorRole: m.role,
        collaboratorSince: m.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search users available to add as collaborators (exclude existing ones).
   */
  async searchAvailableUsers(ownerName: string, slug: string, query: string, actorId: string) {
    const repo = await this.resolveRepo(ownerName, slug);
    await this.ensureManagePermission(repo, actorId);

    // Get existing collaborator IDs
    const existingMembers = await this.prisma.repositoryMember.findMany({
      where: { repositoryId: repo.id },
      select: { userId: true },
    });
    const excludeIds = existingMembers.map((m) => m.userId);

    // Also exclude the owner
    if (repo.ownerUserId) {
      excludeIds.push(repo.ownerUserId);
    }

    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludeIds } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 10,
    });
  }

  /**
   * List organization members that can be added as collaborators.
   */
  async listOrgMembersForRepo(ownerName: string, slug: string, actorId: string, orgName: string) {
    const repo = await this.resolveRepo(ownerName, slug);
    await this.ensureManagePermission(repo, actorId);

    const org = await this.prisma.organization.findUnique({
      where: { name: orgName },
    });
    if (!org) {
      throw new NotFoundException(`Organization "${orgName}" not found`);
    }

    // Get existing collaborator IDs
    const existingMembers = await this.prisma.repositoryMember.findMany({
      where: { repositoryId: repo.id },
      select: { userId: true },
    });
    const existingIds = new Set(existingMembers.map((m) => m.userId));
    if (repo.ownerUserId) existingIds.add(repo.ownerUserId);

    const orgMembers = await this.prisma.organizationMember.findMany({
      where: { orgId: org.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return orgMembers
      .filter((m) => !existingIds.has(m.userId))
      .map((m) => ({
        ...m.user,
        orgRole: m.role,
      }));
  }

  // ─── Private Helpers ────────────────────

  private async resolveRepo(ownerName: string, slug: string) {
    const repo = await this.prisma.repository.findFirst({
      where: {
        slug,
        OR: [{ ownerUser: { username: ownerName } }, { ownerOrg: { name: ownerName } }],
      },
      select: {
        id: true,
        ownerUserId: true,
        ownerOrgId: true,
        visibility: true,
        slug: true,
      },
    });
    if (!repo) throw new NotFoundException('Repository not found');
    return repo;
  }

  private async ensureReadAccess(
    repo: {
      id: string;
      ownerUserId: string | null;
      ownerOrgId: string | null;
      visibility: RepoVisibility;
    },
    userId?: string,
  ) {
    if (repo.visibility === RepoVisibility.PUBLIC) return;
    if (!userId) throw new NotFoundException('Repository not found');
    if (repo.ownerUserId === userId) return;

    const member = await this.prisma.repositoryMember.findFirst({
      where: { repositoryId: repo.id, userId },
    });
    if (member) return;

    if (repo.ownerOrgId) {
      const orgMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: repo.ownerOrgId, userId },
      });
      if (orgMember) return;
    }

    throw new NotFoundException('Repository not found');
  }

  private async ensureManagePermission(
    repo: { id: string; ownerUserId: string | null; ownerOrgId: string | null },
    userId: string,
  ) {
    // Owner always has manage permission
    if (repo.ownerUserId === userId) return;

    // ADMIN or WRITE role members can manage collaborators
    const member = await this.prisma.repositoryMember.findFirst({
      where: {
        repositoryId: repo.id,
        userId,
        role: { in: [RepoRole.ADMIN, RepoRole.WRITE] },
      },
    });
    if (member) return;

    // Org OWNER / ADMIN can manage
    if (repo.ownerOrgId) {
      const orgMember = await this.prisma.organizationMember.findFirst({
        where: {
          orgId: repo.ownerOrgId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });
      if (orgMember) return;
    }

    throw new ForbiddenException('You do not have permission to manage collaborators');
  }
}
