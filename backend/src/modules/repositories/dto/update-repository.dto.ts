import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RepoVisibility } from '@prisma/client';

export class UpdateRepositoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

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
  isArchived?: boolean;
}
