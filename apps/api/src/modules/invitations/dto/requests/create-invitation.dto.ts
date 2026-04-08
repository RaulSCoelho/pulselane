import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'new-member@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.member })
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
