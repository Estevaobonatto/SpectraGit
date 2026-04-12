import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveCommentDto {
  @ApiProperty()
  @IsBoolean()
  resolved: boolean;
}
