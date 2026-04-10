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
  ): Promise<PaginatedResult<unknown>> {
    const where = userId
      ? {
          OR: [
            { visibility: RepoVisibility.PUBLIC },
            { ownerUserId: userId },
            { members: { some: { userId } } },
          ],
        }
      : { visibility: RepoVisibility.PUBLIC };

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
        _count: { select: { issues: true, pullRequests: true, branches: true } },
      },
    });

    if (!repo) throw new NotFoundException('Repository not found');

    if (repo.visibility === RepoVisibility.PRIVATE) {
      if (!userId) throw new NotFoundException('Repository not found');
      const hasAccess = await this.checkAccess(repo.id, userId);
      if (!hasAccess) throw new NotFoundException('Repository not found');
    }

    return repo;
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

  async fork(ownerName: string, slug: string, userId: string) {
    const sourceRepo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.repository.findFirst({
      where: { ownerUserId: userId, slug },
    });
    if (existing) {
      throw new ConflictException('You already have a repository with this name');
    }

    const forkedRepo = await this.prisma.repository.create({
      data: {
        ownerUserId: userId,
        name: sourceRepo.name,
        slug: sourceRepo.slug,
        description: sourceRepo.description,
        visibility: RepoVisibility.PUBLIC,
        defaultBranch: sourceRepo.defaultBranch,
        isFork: true,
        forkSourceRepoId: sourceRepo.id,
      },
    });

    return forkedRepo;
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
