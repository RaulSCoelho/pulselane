import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationInvitationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto';

export class ListInvitationsQueryDto extends CursorPaginationQueryDto {
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
