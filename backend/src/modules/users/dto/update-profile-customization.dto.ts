import { IsString, IsOptional, MaxLength, IsUrl, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileCustomizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  readmeContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  aboutMe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['solid', 'image', 'css'])
  backgroundType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  backgroundColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  backgroundImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  customCss?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  commitChartColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['default', 'warm', 'cool', 'neon', 'custom'])
  commitChartStyle?: string;
}
