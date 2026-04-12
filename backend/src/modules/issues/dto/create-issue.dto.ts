import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID, IsArray, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueType, IssuePriority } from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: IssueType })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

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

  @ApiPropertyOptional({ description: 'Browser/OS context captured automatically' })
  @IsOptional()
  @IsObject()
  techContext?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Dynamic form data based on issue type' })
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}
