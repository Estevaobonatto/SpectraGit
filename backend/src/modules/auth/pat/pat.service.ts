import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePatDto } from './create-pat.dto';

@Injectable()
export class PatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new Personal Access Token.
   * The raw token is returned only at creation time — it is never stored.
   */
  async create(userId: string, dto: CreatePatDto) {
    const rawToken = `sgit_${randomBytes(30).toString('hex')}`;
    const tokenHash = this.hashToken(rawToken);
    const tokenPrefix = rawToken.slice(0, 11);

    const pat = await this.prisma.personalAccessToken.create({
      data: {
        userId,
        name: dto.name,
        tokenHash,
        tokenPrefix,
        scopes: dto.scopes ?? ['repo'],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: pat.id,
      name: pat.name,
      token: rawToken, // Shown only once
      tokenPrefix: pat.tokenPrefix,
      scopes: pat.scopes,
      expiresAt: pat.expiresAt,
      createdAt: pat.createdAt,
    };
  }

  async list(userId: string) {
    return this.prisma.personalAccessToken.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(userId: string, tokenId: string) {
    const pat = await this.prisma.personalAccessToken.findFirst({
      where: { id: tokenId, userId, revokedAt: null },
    });
    if (!pat) throw new NotFoundException('Token not found');

    await this.prisma.personalAccessToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Token revoked' };
  }

  /**
   * Validate a raw token string and return the associated user ID.
   * Returns null if the token is invalid, revoked, or expired.
   */
  async validateToken(rawToken: string): Promise<{ userId: string; scopes: string[] } | null> {
    const tokenHash = this.hashToken(rawToken);

    const pat = await this.prisma.personalAccessToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, scopes: true, revokedAt: true, expiresAt: true },
    });

    if (!pat) return null;
    if (pat.revokedAt) return null;
    if (pat.expiresAt && pat.expiresAt < new Date()) return null;

    // Update last used timestamp (fire-and-forget)
    this.prisma.personalAccessToken
      .update({ where: { id: pat.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return { userId: pat.userId, scopes: pat.scopes };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
