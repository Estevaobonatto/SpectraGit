import {
  IsEmail,
  IsHexColor,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializeSetupDto {
  @ApiProperty({ example: 'SpectraGit', description: 'Display name for this instance' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  appName: string;

  @ApiProperty({
    example: 'http://git.company.com',
    description: 'Public base URL of this instance',
  })
  @IsUrl({ require_tld: false })
  @MaxLength(512)
  baseUrl: string;

  @ApiProperty({ example: '#7C3AED', description: 'Primary brand color (hex)' })
  @IsHexColor()
  primaryColor: string;

  @ApiProperty({ example: 'admin', description: 'Username for the initial admin account' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(39)
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i, {
    message: 'Username may only contain alphanumeric characters and hyphens',
  })
  adminUsername: string;

  @ApiProperty({ example: 'admin@company.com', description: 'Email for the initial admin account' })
  @IsEmail()
  @MaxLength(255)
  adminEmail: string;

  @ApiProperty({ description: 'Password for the initial admin account (min 8 chars)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  adminPassword: string;
}
