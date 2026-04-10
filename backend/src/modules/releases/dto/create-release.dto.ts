import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReleaseDto {
  @ApiProperty({ description: 'Tag name to associate with this release' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tagName!: string;

  @ApiProperty({ description: 'Release title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

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

  @ApiPropertyOptional({ description: 'Target branch (defaults to main)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  targetBranch?: string;

  @ApiPropertyOptional({ description: 'Commit SHA if creating a new tag' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  commitSha?: string;

  @ApiPropertyOptional({ description: 'Tag annotation message' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  tagMessage?: string;
}
