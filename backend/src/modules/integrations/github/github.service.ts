import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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

    this.logger.log(`Importing repository ${githubRepoFullName} for user ${userId}`);

    return {
      name: githubRepo.name,
      description: githubRepo.description,
      isPrivate: githubRepo.private,
      defaultBranch: githubRepo.default_branch,
      cloneUrl: githubRepo.clone_url,
      language: githubRepo.language,
      topics: githubRepo.topics,
    };
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
