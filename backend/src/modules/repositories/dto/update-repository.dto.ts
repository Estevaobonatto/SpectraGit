import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsUrl, MaxLength, ArrayMaxSize, Min, Max, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RepoVisibility } from '@prisma/client';

export class UpdateRepositoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  website?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  topics?: string[];

  @ApiPropertyOptional({ enum: RepoVisibility })
  @IsOptional()
  @IsEnum(RepoVisibility)
  visibility?: RepoVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasIssuesEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasPRsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasWikiEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowMergeCommit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowSquashMerge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowRebaseMerge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoDeleteBranch?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
