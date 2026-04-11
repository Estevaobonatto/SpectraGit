import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepoRole } from '@prisma/client';

export class AddCollaboratorDto {
  @ApiProperty({ description: 'Username of the user to add as collaborator' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ enum: RepoRole, default: RepoRole.READ })
  @IsOptional()
  @IsEnum(RepoRole)
  role?: RepoRole = RepoRole.READ;
}
