import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({ enum: SystemRole })
  @IsOptional()
  @IsEnum(SystemRole)
  systemRole?: SystemRole;

  @ApiPropertyOptional({ description: 'Disable or re-enable a user account' })
  @IsOptional()
  isDisabled?: boolean;
}
