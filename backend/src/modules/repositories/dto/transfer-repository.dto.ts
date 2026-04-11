import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferRepositoryDto {
  @ApiProperty({ description: 'Username or organization name to transfer to' })
  @IsString()
  newOwner: string;

  @ApiPropertyOptional({ description: 'New name for the repository (optional)' })
  @IsOptional()
  @IsString()
  newName?: string;
}
