import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { AuthOrganizationDto } from './auth-organization.dto';

export class AuthMemberDto {
  @ApiProperty({ example: 'clxmem123' })
  id!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.owner })
  role!: MembershipRole;

  @ApiProperty({ type: AuthOrganizationDto })
  organization!: AuthOrganizationDto;
}
