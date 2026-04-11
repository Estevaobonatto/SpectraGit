import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as os from 'os';
import * as fs from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateInstanceSettingsDto } from './dto/update-instance-settings.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Instance Settings ────────────────────────────────────

  async getInstanceSettings() {
    const settings = await this.prisma.instanceSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings) {
      // Return defaults if somehow not seeded yet
      return {
        appName: 'SpectraGit',
        appLogoUrl: null,
        primaryColor: '#7C3AED',
        baseUrl: 'http://localhost',
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpFromEmail: null,
        isSetupComplete: false,
      };
    }
    // Exclude encrypted SMTP password from the response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedSmtpPassword: _, ...rest } = settings;
    return { ...rest, smtpPasswordConfigured: !!settings.encryptedSmtpPassword };
  }

  async updateInstanceSettings(dto: UpdateInstanceSettingsDto) {
    const { smtpPassword, ...rest } = dto;

    const data: Record<string, unknown> = { ...rest };

    if (smtpPassword !== undefined) {
      data.encryptedSmtpPassword = await bcrypt.hash(smtpPassword, 10);
    }

    const updated = await this.prisma.instanceSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedSmtpPassword: _, ...response } = updated;
    return { ...response, smtpPasswordConfigured: !!updated.encryptedSmtpPassword };
  }

  // ─── System Health ────────────────────────────────────────

  async getHealth() {
    const [dbStatus, storageStatus] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkGitStorage(),
    ]);

    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      platform: os.platform(),
      components: {
        database:
          dbStatus.status === 'fulfilled'
            ? dbStatus.value
            : { status: 'error', message: String((dbStatus as PromiseRejectedResult).reason) },
        gitStorage:
          storageStatus.status === 'fulfilled'
            ? storageStatus.value
            : { status: 'error', message: String((storageStatus as PromiseRejectedResult).reason) },
      },
    };
  }

  private async checkDatabase(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - start };
  }

  private async checkGitStorage(): Promise<{
    status: string;
    path: string;
    accessible: boolean;
  }> {
    const gitPath = this.config.get<string>('git.storagePath', '/data/repositories');
    const accessible = fs.existsSync(gitPath);
    return { status: accessible ? 'ok' : 'warning', path: gitPath, accessible };
  }

  // ─── User Management ─────────────────────────────────────

  async listUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          systemRole: true,
          isDisabled: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { ownedRepos: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(userId: string, dto: UpdateUserAdminDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.systemRole !== undefined && { systemRole: dto.systemRole }),
        ...(dto.isDisabled !== undefined && { isDisabled: dto.isDisabled }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        systemRole: true,
        isDisabled: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
