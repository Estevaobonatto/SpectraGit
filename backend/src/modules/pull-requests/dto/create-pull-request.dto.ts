import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePullRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceBranch: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetBranch: string;
}
