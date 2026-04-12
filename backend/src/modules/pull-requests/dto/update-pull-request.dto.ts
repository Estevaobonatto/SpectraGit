import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MergeStrategy } from '@prisma/client';
import { ChecklistItemDto } from './update-checklist.dto';
import { UpdateContextBlocksDto } from './update-context-blocks.dto';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional({ type: [ChecklistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContextBlocksDto)
  contextBlocks?: UpdateContextBlocksDto;
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
