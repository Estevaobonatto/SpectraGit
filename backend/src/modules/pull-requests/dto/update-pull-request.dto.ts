import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MergeStrategy } from '@prisma/client';

export class UpdatePullRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}

export class MergePullRequestDto {
  @ApiPropertyOptional({ enum: MergeStrategy, default: MergeStrategy.MERGE_COMMIT })
  @IsOptional()
  @IsEnum(MergeStrategy)
  strategy?: MergeStrategy = MergeStrategy.MERGE_COMMIT;
}

export class CreatePRCommentDto {
  @IsString()
  body: string;
}
