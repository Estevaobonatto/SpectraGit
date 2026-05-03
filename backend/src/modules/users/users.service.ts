import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateSSHKeyDto } from './dto/ssh-key.dto';
import 'multer';

// S3 key prefix for avatar objects
const AVATAR_PREFIX = 'avatars';

@Injectable()
export class UsersService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('s3.bucket')!;
    this.s3 = new S3Client({
      endpoint: this.configService.get<string>('s3.endpoint'),
      region: this.configService.get<string>('s3.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey')!,
      },
      forcePathStyle: false,
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: {
          select: { provider: true, createdAt: true },
        },
        _count: {
          select: { ownedRepos: true, sshKeys: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
        _count: { select: { ownedRepos: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async createSSHKey(userId: string, dto: CreateSSHKeyDto) {
    const keyParts = dto.publicKey.trim().split(/\s+/);
    if (keyParts.length < 2) {
      throw new BadRequestException('Invalid SSH public key format');
    }

    const fingerprint = crypto
      .createHash('sha256')
      .update(Buffer.from(keyParts[1], 'base64'))
      .digest('hex');

    const existing = await this.prisma.sSHKey.findUnique({
      where: { fingerprint },
    });
    if (existing) {
      throw new ConflictException('SSH key already registered');
    }

    return this.prisma.sSHKey.create({
      data: {
        userId,
        title: dto.title,
        publicKey: dto.publicKey.trim(),
        fingerprint,
      },
    });
  }

  async listSSHKeys(userId: string) {
    return this.prisma.sSHKey.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        fingerprint: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSSHKey(userId: string, keyId: string) {
    const key = await this.prisma.sSHKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) throw new NotFoundException('SSH key not found');

    await this.prisma.sSHKey.delete({ where: { id: keyId } });
    return { message: 'SSH key deleted' };
  }

  async getMostPopularUsers(timeframe: 'week' | 'month' | 'all', limit: number = 20) {
    const since =
      timeframe === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : timeframe === 'month'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : null;

    // Aggregate pulse counts per repo, grouped by owner
    const repos = await this.prisma.repository.findMany({
      where: {
        ownerUserId: { not: null },
        visibility: 'PUBLIC',
      },
      select: {
        ownerUserId: true,
        _count: {
          select: {
            pulses: since ? { where: { createdAt: { gte: since } } } : true,
          },
        },
      },
    });

    const userPulseCounts = new Map<string, number>();
    for (const repo of repos) {
      if (!repo.ownerUserId) continue;
      const current = userPulseCounts.get(repo.ownerUserId) ?? 0;
      userPulseCounts.set(repo.ownerUserId, current + repo._count.pulses);
    }

    const ranked = [...userPulseCounts.entries()].sort(([, a], [, b]) => b - a).slice(0, limit);

    if (ranked.length === 0) return [];

    const userIds = ranked.map(([id]) => id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        createdAt: true,
      },
    });

    return ranked
      .map(([userId, totalPulses]) => ({
        ...users.find((u) => u.id === userId),
        totalPulses,
      }))
      .filter((u) => u.id);
  }

  async searchUsers(query: string, limit: number = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: limit,
    });
  }

  async getOAuthAccounts(userId: string) {
    return this.prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerUserId: true,
        scope: true,
        createdAt: true,
      },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File must be an image (jpeg, png, gif, webp)');
    }

    const ext = path.extname(file.originalname).toLowerCase() || `.${file.mimetype.split('/')[1]}`;
    const filename = `${randomUUID()}${ext}`;
    const s3Key = `${AVATAR_PREFIX}/${userId}/${filename}`;

    // Delete old avatar from S3 if it was previously uploaded here
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    if (existingUser?.avatarUrl) {
      const oldKey = this.extractS3KeyFromAvatarUrl(existingUser.avatarUrl);
      if (oldKey) {
        try {
          await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: oldKey }));
        } catch {
          // Best-effort deletion; do not block upload on cleanup failure
        }
      }
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Store a backend-served URL so no public bucket ACL is needed
    const avatarUrl = `/api/v1/${AVATAR_PREFIX}/${userId}/${filename}`;

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  async getAvatarStream(
    userId: string,
    filename: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    // Validate the filename to prevent path traversal
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }
    const s3Key = `${AVATAR_PREFIX}/${userId}/${filename}`;
    const response = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: s3Key }));
    return {
      stream: response.Body as Readable,
      contentType: response.ContentType ?? 'application/octet-stream',
    };
  }

  /** Returns the S3 key if the given avatarUrl was uploaded via this service, otherwise null. */
  private extractS3KeyFromAvatarUrl(avatarUrl: string): string | null {
    const prefix = `/api/v1/${AVATAR_PREFIX}/`;
    if (avatarUrl.startsWith(prefix)) {
      return `${AVATAR_PREFIX}/${avatarUrl.slice(prefix.length)}`;
    }
    return null;
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted' };
  }

  async getDashboard(userId: string) {
    const [
      repoCount,
      openIssueCount,
      openPrCount,
      assignedIssues,
      pendingPRs,
      recentRepos,
      recentActivity,
      notificationCount,
    ] = await Promise.all([
      this.prisma.repository.count({
        where: { OR: [{ ownerUserId: userId }, { members: { some: { userId } } }] },
      }),
      this.prisma.issue.count({
        where: { assigneeId: userId, status: 'OPEN' },
      }),
      this.prisma.pullRequest.count({
        where: {
          OR: [
            { authorId: userId, status: 'OPEN' },
            { requestedReviewers: { some: { userId } }, status: 'OPEN' },
          ],
        },
      }),
      this.prisma.issue.findMany({
        where: { assigneeId: userId, status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          repository: {
            select: { slug: true, name: true, ownerUser: { select: { username: true } }, ownerOrg: { select: { name: true } } },
          },
          author: { select: { username: true, avatarUrl: true } },
          labels: { include: { label: { select: { name: true, color: true } } } },
        },
      }),
      this.prisma.pullRequest.findMany({
        where: {
          OR: [
            { authorId: userId, status: 'OPEN' },
            { requestedReviewers: { some: { userId } }, status: 'OPEN' },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          repository: {
            select: { slug: true, name: true, ownerUser: { select: { username: true } }, ownerOrg: { select: { name: true } } },
          },
          author: { select: { username: true, avatarUrl: true } },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { status: true },
          },
        },
      }),
      this.prisma.repository.findMany({
        where: { OR: [{ ownerUserId: userId }, { members: { some: { userId } } }] },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          ownerUser: { select: { username: true, avatarUrl: true } },
          ownerOrg: { select: { name: true, avatarUrl: true } },
          _count: { select: { issues: true, pullRequests: true } },
        },
      }),
      this.prisma.activityEvent.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          repository: {
            select: {
              id: true,
              slug: true,
              name: true,
              ownerUser: { select: { username: true } },
              ownerOrg: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      stats: {
        repoCount,
        openIssueCount,
        openPrCount,
        notificationCount,
      },
      assignedIssues,
      pendingPRs,
      recentRepos,
      recentActivity,
    };
  }
}
