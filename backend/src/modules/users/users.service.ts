import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateSSHKeyDto } from './dto/ssh-key.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted' };
  }
}
