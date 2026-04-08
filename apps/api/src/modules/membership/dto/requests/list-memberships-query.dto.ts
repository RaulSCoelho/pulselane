import { ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListMembershipsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'raul' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MembershipRole, example: MembershipRole.member })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
