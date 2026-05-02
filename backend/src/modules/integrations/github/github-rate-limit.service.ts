import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
  used: number;
}

@Injectable()
export class GitHubRateLimitService {
  private readonly logger = new Logger(GitHubRateLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extract rate limit headers from an Octokit response and update the DB.
   */
  async trackRateLimit(
    userId: string,
    response: { headers?: Record<string, unknown> },
  ): Promise<RateLimitInfo | null> {
    const headers = response.headers ?? {};
    const remaining = this.parseHeader(headers['x-ratelimit-remaining']);
    const limit = this.parseHeader(headers['x-ratelimit-limit']);
    const resetUnix = this.parseHeader(headers['x-ratelimit-reset']);

    if (remaining == null || limit == null || resetUnix == null) {
      return null;
    }

    const resetAt = new Date(resetUnix * 1000);

    await this.prisma.oAuthAccount.updateMany({
      where: { userId, provider: 'github' },
      data: {
        lastRateLimitRemaining: remaining,
        lastRateLimitResetAt: resetAt,
      },
    });

    return {
      remaining,
      limit,
      resetAt,
      used: limit - remaining,
    };
  }

  /**
   * Check if the user's GitHub token is still valid.
   */
  async checkTokenHealth(userId: string): Promise<{ valid: boolean; scopes?: string[] }> {
    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: { userId, provider: 'github' },
    });

    if (!oauthAccount?.encryptedAccessToken) {
      return { valid: false };
    }

    const octokit = new Octokit({ auth: oauthAccount.encryptedAccessToken });

    try {
      const response = await octokit.users.getAuthenticated();
      const scopeHeader = (response.headers as Record<string, string>)['x-oauth-scopes'] ?? '';
      const scopes = scopeHeader.split(',').map((s) => s.trim()).filter(Boolean);

      // Token is valid
      if (!oauthAccount.isTokenValid) {
        await this.prisma.oAuthAccount.updateMany({
          where: { userId, provider: 'github' },
          data: { isTokenValid: true },
        });
      }

      await this.trackRateLimit(userId, response);
      return { valid: true, scopes };
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        await this.prisma.oAuthAccount.updateMany({
          where: { userId, provider: 'github' },
          data: { isTokenValid: false },
        });
        this.logger.warn(`GitHub token invalid for user ${userId}`);
        return { valid: false };
      }
      // For other errors, assume token is still valid (network issues, etc.)
      return { valid: oauthAccount.isTokenValid };
    }
  }

  /**
   * Get current rate limit status for a user.
   */
  async getRateLimitStatus(userId: string): Promise<RateLimitInfo | null> {
    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: { userId, provider: 'github' },
    });

    if (!oauthAccount?.encryptedAccessToken) return null;

    const octokit = new Octokit({ auth: oauthAccount.encryptedAccessToken });
    try {
      const { data } = await octokit.rateLimit.get();
      const core = data.resources.core;
      return {
        remaining: core.remaining,
        limit: core.limit,
        resetAt: new Date(core.reset * 1000),
        used: core.used,
      };
    } catch {
      return null;
    }
  }

  /**
   * Wait if rate limit is nearly exhausted.
   */
  async respectRateLimit(userId: string, minRemaining = 10): Promise<void> {
    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: { userId, provider: 'github' },
    });

    if (
      oauthAccount?.lastRateLimitRemaining != null &&
      oauthAccount.lastRateLimitRemaining <= minRemaining &&
      oauthAccount.lastRateLimitResetAt
    ) {
      const now = new Date();
      const waitMs = oauthAccount.lastRateLimitResetAt.getTime() - now.getTime();
      if (waitMs > 0) {
        this.logger.warn(`Rate limit nearly exhausted for user ${userId}, waiting ${Math.ceil(waitMs / 1000)}s`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 60000))); // cap at 60s
      }
    }
  }

  private parseHeader(value: unknown): number | null {
    if (value == null) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }
}
