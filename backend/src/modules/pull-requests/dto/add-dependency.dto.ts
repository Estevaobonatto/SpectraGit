import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddDependencyDto {
  @ApiProperty({ description: 'PR number this PR depends on' })
  @IsInt()
  @IsPositive()
  dependsOnPrNumber: number;
}
