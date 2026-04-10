import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}

export class CreateInlineCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty()
  @IsNumber()
  lineNumber: number;
}
