import { ApiProperty } from '@nestjs/swagger';
import { AuthMemberDto } from './auth-member.dto';

export class MeResponseDto {
  @ApiProperty({ example: 'clx123abc' })
  id!: string;

  @ApiProperty({ example: 'Raul Semicek' })
  name!: string;

  @ApiProperty({ example: 'raul@example.com' })
  email!: string;

  @ApiProperty({ type: [AuthMemberDto] })
  memberships!: AuthMemberDto[];
}
