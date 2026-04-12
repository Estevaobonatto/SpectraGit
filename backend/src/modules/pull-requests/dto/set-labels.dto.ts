import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetLabelsDto {
  @ApiPropertyOptional({ description: 'Array of label IDs to set on the PR', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds: string[] = [];
}
