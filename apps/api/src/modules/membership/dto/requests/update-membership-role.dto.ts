import { ApiProperty } from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'
import { IsEnum } from 'class-validator'

export class UpdateMembershipRoleDto {
  @ApiProperty({ enum: MembershipRole, example: MembershipRole.admin })
  @IsEnum(MembershipRole)
  role!: MembershipRole
}
