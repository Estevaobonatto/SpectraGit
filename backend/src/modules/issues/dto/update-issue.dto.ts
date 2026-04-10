import { IsString, IsOptional, IsEnum, MaxLength, IsUUID, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus } from '@prisma/client';

export class UpdateIssueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  milestoneId?: string;
}

export class CreateCommentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  body?: string;
}

export class CreateIssueCommentDto {
  @IsString()
  @IsOptional()
  body?: string;
}
