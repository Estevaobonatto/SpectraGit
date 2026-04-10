import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { RepoVisibility } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RepositoriesService } from '../../repositories/repositories.service';
import { GitService } from '../../git/git.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly repositoriesService: RepositoriesService,
    private readonly gitService: GitService,
  ) {}

  private getOctokit(accessToken: string): Octokit {
    return new Octokit({ auth: accessToken });
  }

  private async getUserGitHubToken(userId: string): Promise<string> {
    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: { userId, provider: 'github' },
    });
    if (!oauthAccount?.encryptedAccessToken) {
      throw new BadRequestException('GitHub account not linked. Please connect GitHub first.');
    }
    return oauthAccount.encryptedAccessToken;
  }

  async listGitHubRepos(userId: string) {
    const token = await this.getUserGitHubToken(userId);
    const octokit = this.getOctokit(token);

    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      type: 'owner',
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      updatedAt: repo.updated_at,
    }));
  }

  async importRepository(userId: string, githubRepoFullName: string) {
    const token = await this.getUserGitHubToken(userId);
    const octokit = this.getOctokit(token);

    const [owner, repoName] = githubRepoFullName.split('/');
    if (!owner || !repoName) {
      throw new BadRequestException('Invalid repository name. Use format: owner/repo');
    }

    const { data: githubRepo } = await octokit.repos.get({ owner, repo: repoName });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const slug = githubRepo.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');

    // Idempotent: return existing record if already imported
    const existing = await this.prisma.repository.findFirst({
      where: { ownerUserId: userId, slug },
      include: {
        ownerUser: { select: { username: true } },
        ownerOrg: { select: { name: true } },
      },
    });
    if (existing) {
      this.logger.log(`Repository ${githubRepoFullName} already imported, returning existing`);
      return existing;
    }

    this.logger.log(`Importing repository ${githubRepoFullName} for user ${userId}`);

    // Create DB record
    const repo = await this.prisma.repository.create({
      data: {
        ownerUserId: userId,
        name: githubRepo.name,
        slug,
        description: githubRepo.description ?? null,
        visibility: githubRepo.private ? RepoVisibility.PRIVATE : RepoVisibility.PUBLIC,
        defaultBranch: githubRepo.default_branch ?? 'main',
      },
      include: {
        ownerUser: { select: { username: true } },
        ownerOrg: { select: { name: true } },
      },
    });

    try {
      // Clone full history + all branches from GitHub
      // Token embedded in URL for authentication (never logged)
      const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repoName}.git`;
      await this.gitService.cloneFromUrl(user.username, slug, cloneUrl);

      // Seed Branch records from the cloned repo
      const branches = await this.gitService.getLocalBranchesWithSha(user.username, slug);
      if (branches.length > 0) {
        await this.prisma.branch.createMany({
          data: branches.map((b) => ({
            repositoryId: repo.id,
            name: b.name,
            headCommitSha: b.sha || null,
            isProtected: b.name === (githubRepo.default_branch ?? 'main'),
          })),
          skipDuplicates: true,
        });
      }
    } catch (err) {
      // Rollback DB record so the user can retry
      await this.prisma.repository.delete({ where: { id: repo.id } }).catch(() => {});
      throw err;
    }

    return repo;
  }

  async syncRepositoryMetadata(userId: string, githubRepoFullName: string) {
    const token = await this.getUserGitHubToken(userId);
    const octokit = this.getOctokit(token);

    const [owner, repoName] = githubRepoFullName.split('/');

    const [repoData, branches, releases] = await Promise.all([
      octokit.repos.get({ owner, repo: repoName }),
      octokit.repos.listBranches({ owner, repo: repoName, per_page: 100 }),
      octokit.repos.listReleases({ owner, repo: repoName, per_page: 10 }),
    ]);

    return {
      repo: {
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        watchers: repoData.data.watchers_count,
        openIssues: repoData.data.open_issues_count,
        language: repoData.data.language,
        topics: repoData.data.topics,
        updatedAt: repoData.data.updated_at,
      },
      branches: branches.data.map((b) => ({
        name: b.name,
        protected: b.protected,
      })),
      releases: releases.data.map((r) => ({
        tagName: r.tag_name,
        name: r.name,
        prerelease: r.prerelease,
        publishedAt: r.published_at,
      })),
    };
  }

  async getGitHubProfile(userId: string) {
    const token = await this.getUserGitHubToken(userId);
    const octokit = this.getOctokit(token);

    const { data } = await octokit.users.getAuthenticated();

    return {
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
    };
  }
}
