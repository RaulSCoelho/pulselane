import { ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CursorPaginationQueryDto } from '@/common/pagination/dto/cursor-pagination-query.dto';

export class ListMembershipsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 'raul' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MembershipRole, example: MembershipRole.member })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
