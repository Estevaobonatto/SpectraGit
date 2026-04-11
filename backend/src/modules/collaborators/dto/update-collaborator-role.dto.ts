import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RepoRole } from '@prisma/client';

export class UpdateCollaboratorRoleDto {
  @ApiProperty({ enum: RepoRole })
  @IsEnum(RepoRole)
  role: RepoRole;
}
