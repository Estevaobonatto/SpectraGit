import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepoVisibility } from '@prisma/client';

export class CreateRepositoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Repository name can only contain alphanumeric characters, hyphens, underscores and dots',
  })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: RepoVisibility, default: RepoVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(RepoVisibility)
  visibility?: RepoVisibility = RepoVisibility.PUBLIC;

  @ApiPropertyOptional({ default: 'main' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultBranch?: string = 'main';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initWithReadme?: boolean = true;

  @ApiPropertyOptional({ description: 'Organization ID if creating under an org' })
  @IsOptional()
  @IsString()
  orgId?: string;
}
