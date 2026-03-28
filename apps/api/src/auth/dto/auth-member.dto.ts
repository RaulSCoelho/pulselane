import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { AuthOrganizationDto } from './auth-organization.dto';

export class AuthMemberDto {
  @ApiProperty({ example: 'clxmem123' })
  id!: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  @ApiProperty({ enum: MembershipRole, example: MembershipRole.owner })
  role!: MembershipRole;

  @ApiProperty({ type: AuthOrganizationDto })
  organization!: AuthOrganizationDto;
}
