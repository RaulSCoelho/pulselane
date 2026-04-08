import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole, OrganizationInvitationStatus } from '@prisma/client';
import { InvitationInvitedByResponseDto } from './invitation-invited-by-response.dto';
import { InvitationOrganizationResponseDto } from './invitation-organization-response.dto';

export class InvitationResponseDto {
  @ApiProperty({ example: 'clxinv123' })
  id!: string;

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string;

  @ApiProperty({ example: 'clxuser123' })
  invitedByUserId!: string;

  @ApiProperty({ example: 'new-member@example.com' })
  email!: string;

  // The token is exposed for now because invitation delivery is still manual.
  @ApiProperty({ example: '5cc8d2d3a3e7415c9f0f6f2a8f6b2c11' })
  token!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.member })
  role!: MembershipRole;

  @ApiProperty({
    enum: OrganizationInvitationStatus,
    example: OrganizationInvitationStatus.pending,
  })
  status!: OrganizationInvitationStatus;

  @ApiProperty({ example: '2026-04-30T12:00:00.000Z' })
  expiresAt!: Date;

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z', nullable: true })
  acceptedAt!: Date | null;

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z', nullable: true })
  revokedAt!: Date | null;

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: InvitationInvitedByResponseDto })
  invitedBy!: InvitationInvitedByResponseDto;

  @ApiProperty({ type: InvitationOrganizationResponseDto })
  organization!: InvitationOrganizationResponseDto;
}
