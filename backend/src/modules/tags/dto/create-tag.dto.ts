import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'Tag name (e.g. v1.0.0)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._\/-]*$/, { message: 'Tag name contains invalid characters' })
  name: string;

  @ApiProperty({ description: 'Commit SHA to tag' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  commitSha: string;

  @ApiPropertyOptional({ description: 'Tag annotation message' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  message?: string;
}
