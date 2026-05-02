import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExternalIdentity } from '@prisma/client';

export interface GitHubUserPayload {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  html_url?: string | null;
}

@Injectable()
export class GitHubGhostUserService {
  private readonly logger = new Logger(GitHubGhostUserService.name);
  private ghostUserIdCache: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get (or create) the system ghost user ID to use as a fallback author.
   * All external authors without a local User account are attributed to this user
   * in the authorId FK, while externalAuthorId preserves the real GitHub identity.
   */
  async getGhostUserId(): Promise<string> {
    if (this.ghostUserIdCache) return this.ghostUserIdCache;

    let ghost = await this.prisma.user.findUnique({
      where: { username: 'ghost' },
      select: { id: true },
    });

    if (!ghost) {
      ghost = await this.prisma.user.create({
        data: {
          username: 'ghost',
          email: 'ghost@system.local',
          displayName: 'Ghost User',
          passwordHash: '',
        },
        select: { id: true },
      });
      this.logger.log(`Created system ghost user with id ${ghost.id}`);
    }

    this.ghostUserIdCache = ghost.id;
    return ghost.id;
  }

  /**
   * Resolve or create a ghost ExternalIdentity for a GitHub user.
   * If a local User has linked this GitHub account, returns that mapping.
   */
  async resolveGitHubUser(
    githubUser: GitHubUserPayload,
  ): Promise<{ identity: ExternalIdentity; localUserId: string | null }> {
    const externalId = String(githubUser.id);

    // Try to find existing identity
    let identity = await this.prisma.externalIdentity.findUnique({
      where: { provider_externalId: { provider: 'github', externalId } },
    });

    if (identity) {
      // Update avatar/display name if changed
      if (
        identity.avatarUrl !== (githubUser.avatar_url ?? null) ||
        identity.displayName !== (githubUser.name ?? null)
      ) {
        identity = await this.prisma.externalIdentity.update({
          where: { id: identity.id },
          data: {
            avatarUrl: githubUser.avatar_url ?? null,
            displayName: githubUser.name ?? null,
            login: githubUser.login,
          },
        });
      }
      return { identity, localUserId: identity.userId };
    }

    // Check if any local OAuthAccount matches this GitHub user
    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: { provider: 'github', providerUserId: externalId },
    });

    // Create new external identity
    identity = await this.prisma.externalIdentity.create({
      data: {
        provider: 'github',
        externalId,
        login: githubUser.login,
        displayName: githubUser.name ?? null,
        avatarUrl: githubUser.avatar_url ?? null,
        email: githubUser.email ?? null,
        htmlUrl: githubUser.html_url ?? null,
        userId: oauthAccount?.userId ?? null,
      },
    });

    this.logger.log(`Created ExternalIdentity for GitHub user @${githubUser.login}`);
    return { identity, localUserId: identity.userId };
  }

  /**
   * Bulk resolve multiple GitHub users (useful during imports).
   */
  async resolveGitHubUsers(
    githubUsers: GitHubUserPayload[],
  ): Promise<Map<string, ExternalIdentity>> {
    const map = new Map<string, ExternalIdentity>();
    for (const user of githubUsers) {
      const { identity } = await this.resolveGitHubUser(user);
      map.set(String(user.id), identity);
    }
    return map;
  }

  /**
   * Get display author info for an entity that may have an external author.
   */
  async getDisplayAuthor(options: {
    localUserId?: string;
    externalIdentityId?: string | null;
  }): Promise<{
    userId: string;
    externalIdentityId?: string;
    displayName: string;
    avatarUrl: string | null;
    isGhost: boolean;
  } | null> {
    const { localUserId, externalIdentityId } = options;

    if (localUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: localUserId },
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      });
      if (user) {
        return {
          userId: user.id,
          externalIdentityId: externalIdentityId ?? undefined,
          displayName: user.displayName ?? user.username,
          avatarUrl: user.avatarUrl,
          isGhost: false,
        };
      }
    }

    if (externalIdentityId) {
      const identity = await this.prisma.externalIdentity.findUnique({
        where: { id: externalIdentityId },
      });
      if (identity) {
        return {
          userId: localUserId ?? identity.id, // fallback to identity id for UI consistency
          externalIdentityId: identity.id,
          displayName: identity.displayName ?? identity.login,
          avatarUrl: identity.avatarUrl,
          isGhost: true,
        };
      }
    }

    return null;
  }
}
