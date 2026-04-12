import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PrRiskConfigDto {
  @ApiPropertyOptional({ description: 'Max changed files before HIGH risk', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxFiles?: number;

  @ApiPropertyOptional({
    description: 'Max changed lines (added + removed) before HIGH risk',
    default: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLines?: number;

  @ApiPropertyOptional({
    description: 'File path patterns treated as critical (e.g. "prisma/schema.prisma")',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criticalPaths?: string[];
}
