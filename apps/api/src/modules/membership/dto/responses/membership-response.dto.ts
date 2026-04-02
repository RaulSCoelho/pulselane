import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';

export class MembershipResponseDto {
  @ApiProperty({ example: 'clxmembership123' })
  id!: string;

  @ApiProperty({ example: 'clxuser123' })
  userId!: string;

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.owner })
  role!: MembershipRole;

  @ApiProperty({ example: '2026-04-02T18:25:43.511Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-02T18:25:43.511Z' })
  updatedAt!: Date;
}
