import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._\/-]*$/, { message: 'Branch name contains invalid characters' })
  name: string;

  @ApiProperty({ description: 'Source branch or commit SHA to branch from' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._\/-]*$/, { message: 'Start point contains invalid characters' })
  startPoint: string;
}
