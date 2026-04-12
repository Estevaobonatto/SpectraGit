import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, RepoVisibility } from '@prisma/client';
import { spawnSync } from 'child_process';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { ForkRepositoryDto } from './dto/fork-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { UpdateBranchProtectionDto } from './dto/update-branch-protection.dto';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';
import { TransferRepositoryDto } from './dto/transfer-repository.dto';
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
    q?: string,
    sort?: 'updated' | 'recent' | 'trending' | 'forks',
  ): Promise<PaginatedResult<unknown>> {
    const andConditions: Prisma.RepositoryWhereInput[] = [];

    if (userId && scope === 'mine') {
      andConditions.push({ OR: [{ ownerUserId: userId }, { members: { some: { userId } } }] });
    } else if (userId) {
      andConditions.push({
        OR: [
          { visibility: RepoVisibility.PUBLIC },
          { ownerUserId: userId },
          { members: { some: { userId } } },
        ],
      });
    } else {
      andConditions.push({ visibility: RepoVisibility.PUBLIC });
    }

    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.RepositoryWhereInput =
      andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

    const orderBy:
      | Prisma.RepositoryOrderByWithRelationInput
      | Prisma.RepositoryOrderByWithRelationInput[] =
      sort === 'trending'
        ? [
            { pulses: { _count: 'desc' } } as Prisma.RepositoryOrderByWithRelationInput,
            { watches: { _count: 'desc' } } as Prisma.RepositoryOrderByWithRelationInput,
            { forks: { _count: 'desc' } } as Prisma.RepositoryOrderByWithRelationInput,
          ]
        : sort === 'recent'
          ? { createdAt: 'desc' }
          : sort === 'forks'
            ? ({ forks: { _count: 'desc' } } as Prisma.RepositoryOrderByWithRelationInput)
            : { updatedAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.repository.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy,
        include: {
          ownerUser: { select: { username: true, avatarUrl: true } },
          ownerOrg: { select: { name: true, avatarUrl: true } },
          _count: {
            select: { issues: true, pullRequests: true, pulses: true, watches: true, forks: true },
          },
        },
      }),
      this.prisma.repository.count({ where }),
    ]);

    const mapped = items.map((repo) => ({
      ...repo,
      pulseCount: repo._count?.pulses ?? 0,
      watchCount: repo._count?.watches ?? 0,
      forkCount: repo._count?.forks ?? 0,
    }));

    return {
      items: mapped,
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
        _count: {
          select: {
            issues: true,
            pullRequests: true,
            branches: true,
            forks: true,
            pulses: true,
            watches: true,
          },
        },
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
    const forkSlug = forkName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');

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

  // ─── Branch Protection ─────────────────────────────────────

  async getBranchProtection(ownerName: string, slug: string, branchName: string, userId: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    const branch = await this.prisma.branch.findFirst({
      where: { repositoryId: repo.id, name: branchName },
      include: { protectionRule: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    return {
      branchName: branch.name,
      isProtected: branch.isProtected,
      protection: branch.protectionRule,
    };
  }

  async updateBranchProtection(
    ownerName: string,
    slug: string,
    branchName: string,
    userId: string,
    dto: UpdateBranchProtectionDto,
  ) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    const branch = await this.prisma.branch.findFirst({
      where: { repositoryId: repo.id, name: branchName },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    await this.prisma.branch.update({
      where: { id: branch.id },
      data: { isProtected: true },
    });

    const protection = await this.prisma.branchProtectionRule.upsert({
      where: { branchId: branch.id },
      create: { branchId: branch.id, ...dto },
      update: dto,
    });

    return {
      branchName: branch.name,
      isProtected: true,
      protection,
    };
  }

  async removeBranchProtection(
    ownerName: string,
    slug: string,
    branchName: string,
    userId: string,
  ) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    const branch = await this.prisma.branch.findFirst({
      where: { repositoryId: repo.id, name: branchName },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    await this.prisma.branchProtectionRule.deleteMany({
      where: { branchId: branch.id },
    });

    await this.prisma.branch.update({
      where: { id: branch.id },
      data: { isProtected: false },
    });

    return { message: 'Branch protection removed' };
  }

  // ─── Webhooks ──────────────────────────────────────────────

  async listWebhooks(ownerName: string, slug: string, userId: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    return this.prisma.webhook.findMany({
      where: { repositoryId: repo.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        contentType: true,
        events: true,
        isActive: true,
        lastStatus: true,
        lastError: true,
        lastCalledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createWebhook(ownerName: string, slug: string, userId: string, dto: CreateWebhookDto) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    // Validate URL
    try {
      const parsed = new URL(dto.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestException('Webhook URL must use HTTP or HTTPS');
      }
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    return this.prisma.webhook.create({
      data: {
        repositoryId: repo.id,
        url: dto.url,
        secret: dto.secret,
        contentType: dto.contentType || 'application/json',
        events: dto.events || ['push'],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateWebhook(
    ownerName: string,
    slug: string,
    webhookId: string,
    userId: string,
    dto: UpdateWebhookDto,
  ) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, repositoryId: repo.id },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    if (dto.url) {
      try {
        const parsed = new URL(dto.url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new BadRequestException('Webhook URL must use HTTP or HTTPS');
        }
      } catch {
        throw new BadRequestException('Invalid webhook URL');
      }
    }

    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: dto,
    });
  }

  async deleteWebhook(ownerName: string, slug: string, webhookId: string, userId: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    await this.ensureAdmin(repo.id, userId, repo.ownerUser?.id);

    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, repositoryId: repo.id },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    await this.prisma.webhook.delete({ where: { id: webhookId } });
    return { message: 'Webhook deleted' };
  }

  // ─── Transfer Repository ──────────────────────────────────

  async transferRepository(
    ownerName: string,
    slug: string,
    userId: string,
    dto: TransferRepositoryDto,
  ) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    // Only the owner can transfer
    if (repo.ownerUser?.id !== userId) {
      throw new ForbiddenException('Only the repository owner can transfer ownership');
    }

    const newSlug = dto.newName
      ? dto.newName
          .toLowerCase()
          .replace(/[^a-zA-Z0-9._-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : slug;

    // Check if transferring to a user or org
    const targetUser = await this.prisma.user.findUnique({
      where: { username: dto.newOwner },
    });
    const targetOrg = targetUser
      ? null
      : await this.prisma.organization.findUnique({
          where: { name: dto.newOwner },
        });

    if (!targetUser && !targetOrg) {
      throw new NotFoundException('Target user or organization not found');
    }

    // If transferring to org, ensure the user is an admin/owner of that org
    if (targetOrg) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: targetOrg.id, userId } },
      });
      if (!membership || membership.role === 'MEMBER') {
        throw new ForbiddenException('You must be an admin or owner of the target organization');
      }
    }

    // Check name uniqueness in target
    const existingInTarget = targetUser
      ? await this.prisma.repository.findFirst({
          where: { ownerUserId: targetUser.id, slug: newSlug },
        })
      : await this.prisma.repository.findFirst({
          where: { ownerOrgId: targetOrg!.id, slug: newSlug },
        });

    if (existingInTarget) {
      throw new ConflictException(
        `A repository named "${newSlug}" already exists for the target owner`,
      );
    }

    // Move git directory on disk
    const newOwnerName = targetUser ? targetUser.username : targetOrg!.name;
    await this.gitService.moveRepository(ownerName, slug, newOwnerName, newSlug);

    // Update database
    const updatedRepo = await this.prisma.repository.update({
      where: { id: repo.id },
      data: {
        ownerUserId: targetUser ? targetUser.id : null,
        ownerOrgId: targetOrg ? targetOrg.id : null,
        name: dto.newName || repo.name,
        slug: newSlug,
      },
      include: {
        ownerUser: { select: { username: true } },
        ownerOrg: { select: { name: true } },
      },
    });

    return updatedRepo;
  }

  // ─── Archive Download ─────────────────────────────────────

  async downloadArchiveAsZip(
    ownerName: string,
    slug: string,
    branch: string,
    userId?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    // Use DB-validated names for the filesystem path
    const validatedOwner = repo.ownerUser?.username ?? repo.ownerOrg?.name ?? ownerName;
    const repoPath = this.gitService.getRepoPath(validatedOwner, repo.slug);

    // git archive --format=zip is natively supported — no extra tools needed.
    // Use -C (chdir) instead of --git-dir so this works for both bare repos
    // and non-bare working trees (where --git-dir would point at the wrong dir).
    const result = spawnSync('git', ['-C', repoPath, 'archive', '--format=zip', branch], {
      maxBuffer: 256 * 1024 * 1024,
    });

    if (result.status !== 0) {
      const msg = result.stderr?.toString() || 'unknown error';
      throw new BadRequestException(`Failed to create archive for branch "${branch}": ${msg}`);
    }

    const safeBranch = branch.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filename = `${repo.slug}-${safeBranch}.zip`;
    return { buffer: result.stdout as Buffer, filename };
  }

  // ─── PR Risk Config ─────────────────────────────────────────

  async getPrRiskConfig(ownerName: string, slug: string, userId?: string) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);
    return { prRiskConfig: repo.prRiskConfig ?? null };
  }

  async updatePrRiskConfig(
    ownerName: string,
    slug: string,
    userId: string,
    dto: { maxFiles?: number; maxLines?: number; criticalPaths?: string[] },
  ) {
    const repo = await this.findByOwnerAndSlug(ownerName, slug, userId);

    const updated = await this.prisma.repository.update({
      where: { id: repo.id },
      data: { prRiskConfig: dto as unknown as Prisma.InputJsonValue },
      select: { id: true, prRiskConfig: true },
    });
    return { prRiskConfig: updated.prRiskConfig };
  }
}
