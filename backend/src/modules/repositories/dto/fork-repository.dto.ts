import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForkRepositoryDto {
  @ApiPropertyOptional({
    description: 'Custom name for the forked repository. Defaults to the source repository name.',
    example: 'my-fork',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Name can only contain alphanumeric characters, dots, underscores, and hyphens',
  })
  name?: string;
}
