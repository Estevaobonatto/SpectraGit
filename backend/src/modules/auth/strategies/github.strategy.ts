import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../dto/auth.dto';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.github.clientId'),
      clientSecret: configService.get<string>('oauth.github.clientSecret'),
      callbackURL: configService.get<string>('oauth.github.callbackUrl'),
      scope: ['user:email', 'read:user'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string }[];
      displayName?: string;
      username?: string;
      photos?: { value: string }[];
    },
    done: (err: Error | null, user?: OAuthProfile) => void,
  ): void {
    const oauthProfile: OAuthProfile = {
      provider: 'github',
      providerUserId: profile.id,
      email: profile.emails?.[0]?.value || '',
      displayName: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    };
    done(null, oauthProfile);
  }
}
