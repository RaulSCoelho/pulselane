import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLogAction } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ example: 'client' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: 'clxclient123' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: 'clxuser123' })
  @IsOptional()
  @IsString()
  actorUserId?: string;

  @ApiPropertyOptional({
    enum: AuditLogAction,
    example: AuditLogAction.created,
  })
  @IsOptional()
  @IsEnum(AuditLogAction)
  action?: AuditLogAction;
}
