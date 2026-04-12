import { IsOptional, IsIn, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListRepositoriesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['mine', 'all'] })
  @IsOptional()
  @IsIn(['mine', 'all'])
  scope?: 'mine' | 'all';

  @ApiPropertyOptional({ description: 'Search query (matches name and description)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['updated', 'recent', 'trending', 'forks'] })
  @IsOptional()
  @IsIn(['updated', 'recent', 'trending', 'forks'])
  repoSort?: 'updated' | 'recent' | 'trending' | 'forks';
}
