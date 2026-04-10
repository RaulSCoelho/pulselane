import { ApiProperty } from '@nestjs/swagger';
import { CursorPageMetaResponseDto } from '@/common/pagination/dto/cursor-page-meta-response.dto';
import { AuditLogResponseDto } from './audit-log-response.dto';

export class ListAuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items!: AuditLogResponseDto[];

  @ApiProperty({ type: CursorPageMetaResponseDto })
  meta!: CursorPageMetaResponseDto;
}
