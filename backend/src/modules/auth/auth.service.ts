import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/types/request.types';
import { OAuthProfile, TokenResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleOAuthLogin(
    profile: OAuthProfile,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenResponseDto> {
    let user = await this.prisma.user.findFirst({
      where: {
        oauthAccounts: {
          some: {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
          },
        },
      },
    });

    if (!user) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerUserId: profile.providerUserId,
            encryptedAccessToken: profile.accessToken,
            encryptedRefreshToken: profile.refreshToken,
          },
        });
        user = existingUser;
      } else {
        const username = await this.generateUniqueUsername(profile.email);
        user = await this.prisma.user.create({
          data: {
            username,
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            oauthAccounts: {
              create: {
                provider: profile.provider,
                providerUserId: profile.providerUserId,
                encryptedAccessToken: profile.accessToken,
                encryptedRefreshToken: profile.refreshToken,
              },
            },
          },
        });
        this.logger.log(`New user created via ${profile.provider}: ${user.username}`);
      }
    }

    return this.createSession(user.id, user.username, user.email, userAgent, ipAddress);
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken: refreshToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Use deleteMany so concurrent refresh requests on the same token don't
    // throw a P2025 (record not found) which would surface as a 500.
    const deleted = await this.prisma.session.deleteMany({ where: { id: session.id } });
    if (deleted.count === 0) {
      // Another concurrent request already consumed this session.
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.createSession(
      session.user.id,
      session.user.username,
      session.user.email,
      session.userAgent ?? undefined,
      session.ipAddress ?? undefined,
    );
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId, refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return payload;
  }

  private async createSession(
    userId: string,
    username: string,
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenResponseDto> {
    const payload: JwtPayload = { sub: userId, username, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt = new Date();
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
    };
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 30);
    let username = base;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${base}${counter}`;
      counter++;
    }

    return username;
  }
}
