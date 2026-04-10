import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface OAuthProfile {
  provider: string;
  providerUserId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}
