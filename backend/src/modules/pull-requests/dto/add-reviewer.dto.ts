import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReviewerDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}
