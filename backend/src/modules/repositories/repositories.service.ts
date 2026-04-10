import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RepoVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { ForkRepositoryDto } from './dto/fork-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
  ) {}

  async create(userId: string, dto: CreateRepositoryDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');

    const ownerName = await this.getOwnerName(userId, dto.orgId);

    const existing = dto.orgId
      ? await this.prisma.repository.findFirst({
          where: { ownerOrgId: dto.orgId, slug },
        })
      : await this.prisma.repository.findFirst({
          where: { ownerUserId: userId, slug },
        });

    if (existing) {
      throw new ConflictException('Repository with this name already exists');
    }

    if (dto.orgId) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: dto.orgId, userId } },
      });
      if (!membership || membership.role === 'MEMBER') {
        throw new ForbiddenException(
          'You do not have permission to create repositories in this organization',
        );
      }
    }

    const repo = await this.prisma.repository.create({
      data: {
        ownerUserId: dto.orgId ? null : userId,
        ownerOrgId: dto.orgId || null,
        name: dto.name,
        slug,
        description: dto.description,
        visibility: dto.visibility || RepoVisibility.PUBLIC,
        defaultBranch: dto.defaultBranch || 'main',
      },
      include: {
        ownerUser: { select: { username: true } },
        ownerOrg: { select: { name: true } },
      },
    });

    try {
      await this.gitService.initRepository(
        ownerName,
        slug,
        dto.defaultBranch || 'main',
        dto.initWithReadme ?? true,
      );

      if (dto.initWithReadme) {
        const headSha = await this.gitService.getHeadCommitSha(
          ownerName,
          slug,
          dto.defaultBranch || 'main',
        );

        await this.prisma.branch.create({
          data: {
            repositoryId: repo.id,
            name: dto.defaultBranch || 'main',
            headCommitSha: headSha,
          },
        });
      }
    } catch (err) {
      // Rollback DB record so the user can retry without a 409
      await this.prisma.repository.delete({ where: { id: repo.id } });
      throw err;
    }

    return repo;
  }

  async findAll(
    userId: string | null,
    pagination: PaginationDto,
    scope?: 'mine' | 'all',
  ): Promise<PaginatedResult<unknown>> {
    let where;
    if (userId && scope === 'mine') {
      where = {
        OR: [
          { ownerUserId: userId },
          { members: { some: { userId } } },
        ],
      };
    } else if (userId) {
      where = {
        OR: [
          { visibility: RepoVisibility.PUBLIC },
          { ownerUserId: userId },
          { members: { some: { userId } } },
        ],
      };
    } else {
      where = { visibility: RepoVisibility.PUBLIC };
    }

    const [items, total] = await Promise.all([
      this.prisma.repository.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          ownerUser: { select: { username: true, avatarUrl: true } },
          ownerOrg: { select: { name: true, avatarUrl: true } },
          _count: { select: { issues: true, pullRequests: true } },
        },
      }),
      this.prisma.repository.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      totalPages: Math.ceil(total / (pagination.limit ?? 20)),
    };
  }

  async findByOwnerAndSlug(ownerName: string, slug: string, userId?: string) {
    const repo = await this.prisma.repository.findFirst({
      where: {
        slug,
        OR: [{ ownerUser: { username: ownerName } }, { ownerOrg: { name: ownerName } }],
      },
      include: {
        ownerUser: { select: { id: true, username: true, avatarUrl: true } },
        ownerOrg: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { issues: true, pullRequests: true, branches: true, forks: true, pulses: true, watches: true } },
      },
    });

    if (!repo) throw new NotFoundException('Repository not found');

    if (repo.visibility === RepoVisibility.PRIVATE) {
      if (!userId) throw new NotFoundException('Repository not found');
      const hasAccess = await this.checkAccess(repo.id, userId);
      if (!hasAccess) throw new NotFoundException('Repository not found');
    }

    // Compute engagement flags for the current user
    let isPulsed = false;
    let isWatched = false;
    let canEdit = false;
    if (userId) {
      const [pulse, watch] = await Promise.all([
        this.prisma.repositoryPulse.findUnique({
          where: { repositoryId_userId: { repositoryId: repo.id, userId } },
        }),
        this.prisma.repositoryWatch.findUnique({
          where: { repositoryId_userId: { repositoryId: repo.id, userId } },
        }),
      ]);
      isPulsed = !!pulse;
      isWatched = !!watch;
      canEdit = await this.checkWriteAccess(repo.id, userId, repo.ownerUserId, repo.ownerOrgId);
    }

    return {
      ...repo,
      pulseCount: repo._count.pulses,
      watchCount: repo._count.watches,
      forkCount: repo._count.forks,
      isPulsed,
      isWatched,
      canEdit,
    };
  }

  async update(ownerName: string, slug: string, userId: string, dto: UpdateRepositoryDto) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    return this.prisma.repository.update({
      where: { id: repo.id },
      data: dto,
    });
  }

  async delete(ownerName: string, slug: string, userId: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    await this.prisma.repository.delete({ where: { id: repo.id } });
    await this.gitService.deleteRepository(ownerName, slug);

    return { message: 'Repository deleted' };
  }

  async fork(ownerName: string, slug: string, userId: string, dto?: ForkRepositoryDto) {
    const sourceRepo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (sourceRepo.ownerUser?.id === userId) {
      throw new ConflictException(
        'You cannot fork your own repository. Choose a different name to create a copy.',
      );
    }

    const forkName = dto?.name ?? sourceRepo.name;
    const forkSlug = forkName.toLowerCase().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await this.prisma.repository.findFirst({
      where: { ownerUserId: userId, slug: forkSlug },
    });
    if (existing) {
      throw new ConflictException(
        `You already have a repository named "${forkSlug}". Choose a different name.`,
      );
    }

    const forkedRepo = await this.prisma.repository.create({
      data: {
        ownerUserId: userId,
        name: forkName,
        slug: forkSlug,
        description: sourceRepo.description,
        visibility: RepoVisibility.PUBLIC,
        defaultBranch: sourceRepo.defaultBranch,
        isFork: true,
        forkSourceRepoId: sourceRepo.id,
      },
      include: {
        ownerUser: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    try {
      await this.gitService.cloneLocal(ownerName, slug, user.username, forkedRepo.slug);

      // Create branch records from the forked repo's actual branches on disk
      const sourceBranches = await this.gitService.getLocalBranchesWithSha(
        user.username,
        forkedRepo.slug,
      );
      if (sourceBranches.length > 0) {
        await this.prisma.branch.createMany({
          data: sourceBranches.map((b) => ({
            repositoryId: forkedRepo.id,
            name: b.name,
            headCommitSha: b.sha,
          })),
          skipDuplicates: true,
        });
      }
    } catch (err) {
      await this.prisma.repository.delete({ where: { id: forkedRepo.id } });
      throw err;
    }

    return forkedRepo;
  }

  // ─── Pulse (like/favorite) ────────────────────────────────

  async pulseRepo(userId: string, ownerName: string, slug: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    await this.prisma.repositoryPulse.upsert({
      where: { repositoryId_userId: { repositoryId: repo.id, userId } },
      create: { repositoryId: repo.id, userId },
      update: {},
    });

    const count = await this.prisma.repositoryPulse.count({
      where: { repositoryId: repo.id },
    });

    return { count, isActive: true };
  }

  async unpulseRepo(userId: string, ownerName: string, slug: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    await this.prisma.repositoryPulse.deleteMany({
      where: { repositoryId: repo.id, userId },
    });

    const count = await this.prisma.repositoryPulse.count({
      where: { repositoryId: repo.id },
    });

    return { count, isActive: false };
  }

  // ─── Watch ────────────────────────────────────────────────

  async watchRepo(userId: string, ownerName: string, slug: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    await this.prisma.repositoryWatch.upsert({
      where: { repositoryId_userId: { repositoryId: repo.id, userId } },
      create: { repositoryId: repo.id, userId },
      update: {},
    });

    const count = await this.prisma.repositoryWatch.count({
      where: { repositoryId: repo.id },
    });

    return { count, isActive: true };
  }

  async unwatchRepo(userId: string, ownerName: string, slug: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    await this.prisma.repositoryWatch.deleteMany({
      where: { repositoryId: repo.id, userId },
    });

    const count = await this.prisma.repositoryWatch.count({
      where: { repositoryId: repo.id },
    });

    return { count, isActive: false };
  }

  async getFileTree(
    ownerName: string,
    slug: string,
    branch: string,
    dirPath?: string,
    userId?: string,
  ) {
    await this.findByOwnerAndSlug(ownerName, slug, userId);
    return this.gitService.getFileTree(ownerName, slug, branch, dirPath);
  }

  async getFileContent(
    ownerName: string,
    slug: string,
    branch: string,
    filePath: string,
    userId?: string,
  ) {
    await this.findByOwnerAndSlug(ownerName, slug, userId);
    return this.gitService.getFileContent(ownerName, slug, branch, filePath);
  }

  async getUserRepos(username: string, userId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const where =
      userId === user.id
        ? { ownerUserId: user.id }
        : { ownerUserId: user.id, visibility: RepoVisibility.PUBLIC };

    return this.prisma.repository.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { issues: true, pullRequests: true } },
      },
    });
  }

  private async checkAccess(repoId: string, userId: string): Promise<boolean> {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repoId },
      select: { ownerUserId: true, ownerOrgId: true },
    });

    if (repo?.ownerUserId === userId) return true;

    const member = await this.prisma.repositoryMember.findFirst({
      where: { repositoryId: repoId, userId },
    });
    if (member) return true;

    if (repo?.ownerOrgId) {
      const orgMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: repo.ownerOrgId, userId },
      });
      if (orgMember) return true;
    }

    return false;
  }

  private async checkWriteAccess(
    repoId: string,
    userId: string,
    ownerUserId: string | null,
    ownerOrgId: string | null,
  ): Promise<boolean> {
    if (ownerUserId === userId) return true;

    const member = await this.prisma.repositoryMember.findFirst({
      where: { repositoryId: repoId, userId },
    });
    if (member && ['ADMIN', 'MAINTAINER', 'WRITE'].includes(member.role)) return true;

    if (ownerOrgId) {
      const orgMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: ownerOrgId, userId },
      });
      if (orgMember && ['OWNER', 'ADMIN'].includes(orgMember.role)) return true;
    }

    return false;
  }

  private async ensureAdmin(repoId: string, userId: string, ownerId?: string) {
    if (ownerId === userId) return;

    const member = await this.prisma.repositoryMember.findFirst({
      where: { repositoryId: repoId, userId, role: 'ADMIN' },
    });
    if (!member) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async getOwnerName(userId: string, orgId?: string): Promise<string> {
    if (orgId) {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new NotFoundException('Organization not found');
      return org.name;
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user.username;
  }

  async getStats(ownerName: string, slug: string, userId?: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    const [
      languages,
      contributors,
      branchCount,
      tagCount,
      openIssueCount,
      openPrCount,
      labelCount,
    ] = await Promise.all([
      this.gitService.getLanguageBreakdown(ownerName, slug, repo.defaultBranch),
      this.gitService.getContributors(ownerName, slug, repo.defaultBranch),
      this.prisma.branch.count({ where: { repositoryId: repo.id } }),
      this.prisma.tag.count({ where: { repositoryId: repo.id } }),
      this.prisma.issue.count({ where: { repositoryId: repo.id, status: 'OPEN' } }),
      this.prisma.pullRequest.count({ where: { repositoryId: repo.id, status: 'OPEN' } }),
      this.prisma.label.count({ where: { repositoryId: repo.id } }),
    ]);

    return {
      languages,
      contributors,
      branchCount,
      tagCount,
      openIssueCount,
      openPrCount,
      labelCount,
    };
  }
}
