import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '@/common/dto/pagination-meta-response.dto';
import { AuditLogResponseDto } from './audit-log-response.dto';

export class ListAuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items!: AuditLogResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMetaResponseDto;
}
