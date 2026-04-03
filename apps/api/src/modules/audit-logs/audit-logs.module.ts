import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogRepository } from './audit-log.repository';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [MembershipModule, OrganizationModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogRepository],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
