import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PinRepositoryDto {
  @ApiProperty()
  @IsUUID()
  repositoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  sortOrder?: number;
}
