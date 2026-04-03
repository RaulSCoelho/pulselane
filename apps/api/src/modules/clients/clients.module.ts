import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientRepository } from './client.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [MembershipModule, AuditLogsModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientRepository],
  exports: [ClientsService],
})
export class ClientsModule {}
