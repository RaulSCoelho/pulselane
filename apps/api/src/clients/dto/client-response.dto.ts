import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus } from '@prisma/client';

export class ClientResponseDto {
  @ApiProperty({ example: 'clxclient123' })
  id!: string;

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;

  @ApiProperty({ example: 'contact@acme.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: 'Acme Corporation', nullable: true })
  companyName!: string | null;

  @ApiProperty({ enum: ClientStatus, example: ClientStatus.active })
  status!: ClientStatus;

  @ApiProperty({ example: '2026-03-28T20:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-03-28T20:00:00.000Z' })
  updatedAt!: Date;
}
