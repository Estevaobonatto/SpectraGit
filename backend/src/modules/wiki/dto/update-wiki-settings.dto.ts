import { IsEnum, IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WikiSourceMode } from '@prisma/client';

export class UpdateWikiSettingsDto {
  @ApiPropertyOptional({ enum: WikiSourceMode })
  @IsOptional()
  @IsEnum(WikiSourceMode)
  sourceMode?: WikiSourceMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceRoot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  homePage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowAttachments?: boolean;
}
