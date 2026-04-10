import { Injectable } from '@nestjs/common';
import { GitService } from '../git/git.service';
import { RepositoriesService } from '../repositories/repositories.service';

@Injectable()
export class CommitsService {
  constructor(
    private readonly gitService: GitService,
    private readonly reposService: RepositoriesService,
  ) {}

  async getCommitsByBranch(
    owner: string,
    repo: string,
    branch: string,
    limit: number = 30,
    offset: number = 0,
    userId?: string,
  ) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.gitService.getCommitLog(owner, repo, branch, limit, offset);
  }

  async getCommitDetail(owner: string, repo: string, sha: string, userId?: string) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.gitService.getCommitDetail(owner, repo, sha);
  }

  async getCommitDiff(owner: string, repo: string, sha: string, userId?: string) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    return this.gitService.getCommitDiff(owner, repo, sha);
  }

  async compareBranches(owner: string, repo: string, base: string, head: string, userId?: string) {
    await this.reposService.findByOwnerAndSlug(owner, repo, userId);
    const diff = await this.gitService.getDiffBetween(owner, repo, base, head);
    return { base, head, diff };
  }
}
