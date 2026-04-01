import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { AuthOrganizationDto } from './auth-organization.dto';
import { AuthUserDto } from './auth-user.dto';

class SignupMembershipDto {
  @ApiProperty({ example: 'clxmem123' })
  id!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.owner })
  role!: MembershipRole;
}

export class SignupResponseDto {
  @ApiProperty({ example: 'jwt-token-here' })
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: AuthOrganizationDto })
  organization!: AuthOrganizationDto;

  @ApiProperty({ type: SignupMembershipDto })
  membership!: SignupMembershipDto;
}
