import {
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInstanceSettingsDto {
  @ApiPropertyOptional({ example: 'MyCompany Git' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  appName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.company.com/logo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  appLogoUrl?: string;

  @ApiPropertyOptional({ example: '#7C3AED' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'https://git.company.com' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(512)
  baseUrl?: string;

  @ApiPropertyOptional({ example: 'smtp.company.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ example: 'noreply@company.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpUser?: string;

  @ApiPropertyOptional({ example: 'noreply@company.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpFromEmail?: string;

  @ApiPropertyOptional({ description: 'SMTP password (will be encrypted at rest)' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  smtpPassword?: string;
}
