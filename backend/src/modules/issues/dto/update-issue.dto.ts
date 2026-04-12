import { IsString, IsOptional, IsEnum, MaxLength, IsUUID, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus, IssueType, IssuePriority, IssueCloseReason } from '@prisma/client';

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

  @ApiPropertyOptional({ enum: IssueType })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueCloseReason })
  @IsOptional()
  @IsEnum(IssueCloseReason)
  closeReason?: IssueCloseReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closeReasonNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignedArea?: string;

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
