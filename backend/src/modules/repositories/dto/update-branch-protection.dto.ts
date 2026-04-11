import { IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBranchProtectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requirePullRequest?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  requiredReviewCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dismissStaleReviews?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireCodeOwnerReview?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  restrictPushes?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowForcePushes?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowDeletions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireLinearHistory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lockBranch?: boolean;
}
