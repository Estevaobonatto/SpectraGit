import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { ActivityService } from '../activity/activity.service';
import { CreateWikiPageDto } from './dto/create-wiki-page.dto';
import { UpdateWikiPageDto } from './dto/update-wiki-page.dto';
import { UpdateWikiSettingsDto } from './dto/update-wiki-settings.dto';
import { CreateWikiCommentDto } from './dto/create-wiki-comment.dto';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const pageInclude = {
  createdBy: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  updatedBy: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
};

const commentInclude = {
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
};

@Injectable()
export class WikiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reposService: RepositoriesService,
    private readonly activityService: ActivityService,
  ) {}

  // ─── Settings ────────────────────────────────────────────────

  async getSettings(owner: string, repo: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    if (!repoEntity.hasWikiEnabled) {
      throw new NotFoundException('Wiki is not enabled for this repository');
    }

    let settings = await this.prisma.wikiSettings.findUnique({
      where: { repositoryId: repoEntity.id },
    });

    if (!settings) {
      settings = await this.prisma.wikiSettings.create({
        data: { repositoryId: repoEntity.id },
      });
    }

    return settings;
  }

  async updateSettings(
    owner: string,
    repo: string,
    userId: string,
    dto: UpdateWikiSettingsDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    return this.prisma.wikiSettings.upsert({
      where: { repositoryId: repoEntity.id },
      create: { repositoryId: repoEntity.id, ...dto },
      update: dto,
    });
  }

  // ─── Pages ───────────────────────────────────────────────────

  async listPages(owner: string, repo: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    if (!repoEntity.hasWikiEnabled) {
      throw new NotFoundException('Wiki is not enabled for this repository');
    }

    return this.prisma.wikiPage.findMany({
      where: { repositoryId: repoEntity.id },
      include: pageInclude,
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async getPage(owner: string, repo: string, slug: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    if (!repoEntity.hasWikiEnabled) {
      throw new NotFoundException('Wiki is not enabled for this repository');
    }

    const page = await this.prisma.wikiPage.findUnique({
      where: {
        repositoryId_slug: { repositoryId: repoEntity.id, slug },
      },
      include: {
        ...pageInclude,
        children: {
          select: { id: true, slug: true, title: true, sortOrder: true },
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        },
      },
    });

    if (!page) throw new NotFoundException('Wiki page not found');
    return page;
  }

  async createPage(
    owner: string,
    repo: string,
    userId: string,
    dto: CreateWikiPageDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    if (!repoEntity.hasWikiEnabled) {
      throw new NotFoundException('Wiki is not enabled for this repository');
    }

    const slug = slugify(dto.title);
    if (!slug) {
      throw new ConflictException('Title produces an invalid slug');
    }

    const existing = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (existing) {
      throw new ConflictException(`A wiki page with slug "${slug}" already exists`);
    }

    const page = await this.prisma.wikiPage.create({
      data: {
        repositoryId: repoEntity.id,
        slug,
        title: dto.title,
        body: dto.body,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        createdById: userId,
        updatedById: userId,
        versions: {
          create: {
            title: dto.title,
            body: dto.body,
            version: 1,
            editorId: userId,
            message: dto.message ?? 'Initial creation',
          },
        },
      },
      include: pageInclude,
    });

    await this.activityService.record({
      repositoryId: repoEntity.id,
      actorId: userId,
      type: 'WIKI_PAGE_CREATED',
      metadata: { pageId: page.id, title: page.title, slug: page.slug },
    });

    return page;
  }

  async updatePage(
    owner: string,
    repo: string,
    slug: string,
    userId: string,
    dto: UpdateWikiPageDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    if (!repoEntity.hasWikiEnabled) {
      throw new NotFoundException('Wiki is not enabled for this repository');
    }

    const page = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (!page) throw new NotFoundException('Wiki page not found');

    // Compute new slug if title changes
    let newSlug = slug;
    if (dto.title && dto.title !== page.title) {
      newSlug = slugify(dto.title);
      if (newSlug !== slug) {
        const conflict = await this.prisma.wikiPage.findUnique({
          where: { repositoryId_slug: { repositoryId: repoEntity.id, slug: newSlug } },
        });
        if (conflict) {
          throw new ConflictException(`A wiki page with slug "${newSlug}" already exists`);
        }
      }
    }

    // Get latest version number
    const latestVersion = await this.prisma.wikiPageVersion.findFirst({
      where: { pageId: page.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const updated = await this.prisma.wikiPage.update({
      where: { id: page.id },
      data: {
        title: dto.title ?? page.title,
        body: dto.body ?? page.body,
        slug: newSlug,
        parentId: dto.parentId !== undefined ? dto.parentId : page.parentId,
        sortOrder: dto.sortOrder ?? page.sortOrder,
        updatedById: userId,
        versions: {
          create: {
            title: dto.title ?? page.title,
            body: dto.body ?? page.body,
            version: nextVersion,
            editorId: userId,
            message: dto.message,
          },
        },
      },
      include: pageInclude,
    });

    await this.activityService.record({
      repositoryId: repoEntity.id,
      actorId: userId,
      type: 'WIKI_PAGE_UPDATED',
      metadata: { pageId: page.id, title: updated.title, slug: updated.slug },
    });

    return updated;
  }

  async deletePage(owner: string, repo: string, slug: string, userId: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const page = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (!page) throw new NotFoundException('Wiki page not found');

    await this.prisma.wikiPage.delete({ where: { id: page.id } });

    await this.activityService.record({
      repositoryId: repoEntity.id,
      actorId: userId,
      type: 'WIKI_PAGE_DELETED',
      metadata: { pageId: page.id, title: page.title, slug: page.slug },
    });
  }

  // ─── Versions ────────────────────────────────────────────────

  async listVersions(owner: string, repo: string, slug: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const page = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (!page) throw new NotFoundException('Wiki page not found');

    return this.prisma.wikiPageVersion.findMany({
      where: { pageId: page.id },
      include: {
        editor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  async getVersion(
    owner: string,
    repo: string,
    slug: string,
    version: number,
    userId?: string,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const page = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (!page) throw new NotFoundException('Wiki page not found');

    const v = await this.prisma.wikiPageVersion.findUnique({
      where: { pageId_version: { pageId: page.id, version } },
      include: {
        editor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    if (!v) throw new NotFoundException('Version not found');
    return v;
  }

  async restoreVersion(
    owner: string,
    repo: string,
    slug: string,
    version: number,
    userId: string,
  ) {
    const v = await this.getVersion(owner, repo, slug, version, userId);
    return this.updatePage(owner, repo, slug, userId, {
      title: v.title,
      body: v.body,
      message: `Restored from version ${version}`,
    });
  }

  // ─── Comments ────────────────────────────────────────────────

  async listComments(owner: string, repo: string, slug: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const page = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (!page) throw new NotFoundException('Wiki page not found');

    return this.prisma.wikiComment.findMany({
      where: { pageId: page.id },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async createComment(
    owner: string,
    repo: string,
    slug: string,
    userId: string,
    dto: CreateWikiCommentDto,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    if (!repoEntity.hasWikiEnabled) {
      throw new NotFoundException('Wiki is not enabled for this repository');
    }

    const settings = await this.prisma.wikiSettings.findUnique({
      where: { repositoryId: repoEntity.id },
    });
    if (settings && !settings.allowComments) {
      throw new ForbiddenException('Comments are disabled for this wiki');
    }

    const page = await this.prisma.wikiPage.findUnique({
      where: { repositoryId_slug: { repositoryId: repoEntity.id, slug } },
    });
    if (!page) throw new NotFoundException('Wiki page not found');

    return this.prisma.wikiComment.create({
      data: {
        pageId: page.id,
        authorId: userId,
        body: dto.body,
      },
      include: commentInclude,
    });
  }

  async deleteComment(
    owner: string,
    repo: string,
    commentId: string,
    userId: string,
  ) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const comment = await this.prisma.wikiComment.findUnique({
      where: { id: commentId },
      include: { page: true },
    });
    if (!comment || comment.page.repositoryId !== repoEntity.id) {
      throw new NotFoundException('Comment not found');
    }

    // Author can delete their own comments
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the comment author can delete this comment');
    }

    await this.prisma.wikiComment.delete({ where: { id: commentId } });
  }
}
