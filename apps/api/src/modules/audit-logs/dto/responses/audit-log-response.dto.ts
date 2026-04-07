import { ApiProperty } from '@nestjs/swagger';
import { AuditLogAction } from '@prisma/client';
import { AuditLogActorResponseDto } from './audit-log-actor-response.dto';
import { type JsonValue } from '@prisma/client/runtime/library';

export class AuditLogResponseDto {
  @ApiProperty({ example: 'clxaudit123' })
  id!: string;

  @ApiProperty({ example: 'clxorg123' })
  organizationId!: string;

  @ApiProperty({ example: 'clxuser123' })
  actorUserId!: string;

  @ApiProperty({ example: 'client' })
  entityType!: string;

  @ApiProperty({ example: 'clxclient123' })
  entityId!: string;

  @ApiProperty({ enum: AuditLogAction, example: AuditLogAction.created })
  action!: AuditLogAction;

  @ApiProperty({
    example: {
      name: 'Acme Corp',
      status: 'active',
    },
    nullable: true,
  })
  metadata!: JsonValue;

  @ApiProperty({ type: AuditLogActorResponseDto })
  actorUser!: AuditLogActorResponseDto;

  @ApiProperty({ example: '2026-04-03T20:00:00.000Z' })
  createdAt!: Date;
}
