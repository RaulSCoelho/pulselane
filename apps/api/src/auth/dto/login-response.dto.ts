import { ApiProperty } from '@nestjs/swagger';
import { AuthMemberDto } from './auth-member.dto';
import { AuthUserDto } from './auth-user.dto';

export class LoginResponseDto {
  @ApiProperty({ example: 'jwt-token-here' })
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: [AuthMemberDto] })
  memberships!: AuthMemberDto[];
}
