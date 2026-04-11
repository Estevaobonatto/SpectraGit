import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
    private readonly reposService: RepositoriesService,
  ) {}

  async list(owner: string, repo: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.prisma.tag.findMany({
      where: { repositoryId: repoEntity.id },
      include: { release: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(owner: string, repo: string, tagName: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const tag = await this.prisma.tag.findFirst({
      where: { repositoryId: repoEntity.id, name: tagName },
      include: { release: true },
    });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async create(owner: string, repo: string, userId: string, dto: CreateTagDto) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const existing = await this.prisma.tag.findFirst({
      where: { repositoryId: repoEntity.id, name: dto.name },
    });
    if (existing) throw new ConflictException('Tag already exists');

    await this.gitService.createTag(owner, repo, dto.name, dto.commitSha, dto.message);

    return this.prisma.tag.create({
      data: {
        repositoryId: repoEntity.id,
        name: dto.name,
        commitSha: dto.commitSha,
        message: dto.message ?? null,
      },
    });
  }

  async delete(owner: string, repo: string, tagName: string, userId: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const tag = await this.prisma.tag.findFirst({
      where: { repositoryId: repoEntity.id, name: tagName },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    await this.gitService.deleteTag(owner, repo, tagName);
    await this.prisma.tag.delete({ where: { id: tag.id } });

    return { message: 'Tag deleted' };
  }
}
