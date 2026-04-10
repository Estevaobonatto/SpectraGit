import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
    private readonly reposService: RepositoriesService,
  ) {}

  async list(owner: string, repo: string, userId?: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.prisma.branch.findMany({
      where: { repositoryId: repoEntity.id },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(owner: string, repo: string, userId: string, dto: CreateBranchDto) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    const existing = await this.prisma.branch.findFirst({
      where: { repositoryId: repoEntity.id, name: dto.name },
    });
    if (existing) throw new ConflictException('Branch already exists');

    await this.gitService.createBranch(owner, repo, dto.name, dto.startPoint);

    const headSha = await this.gitService.getHeadCommitSha(owner, repo, dto.name);

    return this.prisma.branch.create({
      data: {
        repositoryId: repoEntity.id,
        name: dto.name,
        headCommitSha: headSha,
      },
    });
  }

  async delete(owner: string, repo: string, branchName: string, userId: string) {
    const repoEntity = await this.reposService.findByOwnerAndSlug(owner, repo, userId);

    if (branchName === repoEntity.defaultBranch) {
      throw new ForbiddenException('Cannot delete the default branch');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { repositoryId: repoEntity.id, name: branchName },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    if (branch.isProtected) {
      throw new ForbiddenException('Cannot delete a protected branch');
    }

    await this.gitService.deleteBranch(owner, repo, branchName);
    await this.prisma.branch.delete({ where: { id: branch.id } });

    return { message: 'Branch deleted' };
  }
}
