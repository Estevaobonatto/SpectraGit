import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReleaseDto {
  @ApiPropertyOptional({ description: 'Release title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Release notes (Markdown)' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ description: 'Mark as draft' })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @ApiPropertyOptional({ description: 'Mark as pre-release' })
  @IsBoolean()
  @IsOptional()
  isPrerelease?: boolean;

  @ApiPropertyOptional({ description: 'Target branch' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  targetBranch?: string;
}
