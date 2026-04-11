import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { InitializeSetupDto } from './dto/initialize-setup.dto';

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<{ isSetupComplete: boolean; hasAdminUser: boolean }> {
    const settings = await this.prisma.instanceSettings.findUnique({
      where: { id: 'singleton' },
      select: { isSetupComplete: true },
    });

    const hasAdminUser = await this.prisma.user.count({
      where: { systemRole: 'SYSTEM_ADMIN', isDisabled: false },
    });

    return {
      isSetupComplete: settings?.isSetupComplete ?? false,
      hasAdminUser: hasAdminUser > 0,
    };
  }

  async getBranding(): Promise<{
    appName: string;
    appLogoUrl: string | null;
    primaryColor: string;
  }> {
    const settings = await this.prisma.instanceSettings.findUnique({
      where: { id: 'singleton' },
      select: { appName: true, appLogoUrl: true, primaryColor: true },
    });
    return {
      appName: settings?.appName ?? 'SpectraGit',
      appLogoUrl: settings?.appLogoUrl ?? null,
      primaryColor: settings?.primaryColor ?? '#7C3AED',
    };
  }

  async initialize(dto: InitializeSetupDto): Promise<{ message: string }> {
    const existing = await this.prisma.instanceSettings.findUnique({
      where: { id: 'singleton' },
      select: { isSetupComplete: true },
    });

    if (existing?.isSetupComplete) {
      throw new BadRequestException('Instance is already configured');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.adminUsername.toLowerCase() },
    });
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          username: dto.adminUsername.toLowerCase(),
          email: dto.adminEmail.toLowerCase(),
          displayName: dto.adminUsername,
          passwordHash,
          systemRole: 'SYSTEM_ADMIN',
        },
      });

      await tx.instanceSettings.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          appName: dto.appName,
          primaryColor: dto.primaryColor,
          baseUrl: dto.baseUrl,
          isSetupComplete: true,
        },
        update: {
          appName: dto.appName,
          primaryColor: dto.primaryColor,
          baseUrl: dto.baseUrl,
          isSetupComplete: true,
        },
      });
    });

    return { message: 'Instance initialized successfully' };
  }
}
