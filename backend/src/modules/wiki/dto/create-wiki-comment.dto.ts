import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWikiCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;
}
