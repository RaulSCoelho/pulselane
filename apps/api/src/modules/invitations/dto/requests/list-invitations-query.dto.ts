import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationInvitationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListInvitationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'member@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    enum: OrganizationInvitationStatus,
    example: OrganizationInvitationStatus.pending,
  })
  @IsOptional()
  @IsEnum(OrganizationInvitationStatus)
  status?: OrganizationInvitationStatus;
}
