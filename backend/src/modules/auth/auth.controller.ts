import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenDto, OAuthProfile } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/request.types';

const REFRESH_COOKIE = 'spectragit_rt';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /** Attach the refresh token as an HttpOnly cookie on the response. */
  private setRefreshCookie(res: Response, refreshToken: string): void {
    const isProduction = this.configService.get('node.env') === 'production';
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /** Clear the refresh token cookie. */
  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }

  // ── Google OAuth ──────────────────────────────────────────

  @Public()
  @Get('oauth/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleLogin() {
    // Guard redirects to Google
  }

  @Public()
  @Get('oauth/google/callback')
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as OAuthProfile;
    const tokens = await this.authService.handleOAuthLogin(
      profile,
      req.headers['user-agent'],
      req.ip,
    );

    const code = await this.authService.storeOAuthCode(tokens);
    const frontendUrl = this.configService.get<string>('frontend.url');
    res.redirect(`${frontendUrl}/auth/callback/google?code=${code}`);
  }

  // ── GitHub OAuth ──────────────────────────────────────────

  @Public()
  @Get('oauth/github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  githubLogin() {
    // Guard redirects to GitHub
  }

  @Public()
  @Get('oauth/github/callback')
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as OAuthProfile;
    const tokens = await this.authService.handleOAuthLogin(
      profile,
      req.headers['user-agent'],
      req.ip,
    );

    const code = await this.authService.storeOAuthCode(tokens);
    const frontendUrl = this.configService.get<string>('frontend.url');
    res.redirect(`${frontendUrl}/auth/callback/github?code=${code}`);
  }

  // ── Token management ──────────────────────────────────────

  @Public()
  @Post('exchange')
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange one-time OAuth code for tokens' })
  async exchange(@Body('code') code: string, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.exchangeOAuthCode(code);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn };
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept refresh token from HttpOnly cookie OR from body (backwards compatibility)
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || dto.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }
    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || dto.refreshToken;
    if (refreshToken) {
      await this.authService.logout(user.sub, refreshToken);
    }
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Post('logout/all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all sessions' })
  async logoutAll(@CurrentUser() user: JwtPayload) {
    await this.authService.logoutAll(user.sub);
    return { message: 'All sessions terminated' };
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions' })
  async getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getActiveSessions(user.sub);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(@CurrentUser() user: JwtPayload, @Param('id') sessionId: string) {
    await this.authService.revokeSession(user.sub, sessionId);
    return { message: 'Session revoked' };
  }
}
