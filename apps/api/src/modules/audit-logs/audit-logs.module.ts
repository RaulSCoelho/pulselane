import { OrganizationModule } from '@/modules/organization/organization.module'
import { Module } from '@nestjs/common'

import { AuditLogRepository } from './audit-log.repository'
import { AuditLogsController } from './audit-logs.controller'
import { AuditLogsService } from './audit-logs.service'

@Module({
  imports: [OrganizationModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogRepository],
  exports: [AuditLogsService]
})
export class AuditLogsModule {}
