import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [MembershipModule, ProjectsModule, AuditLogsModule],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
})
export class TasksModule {}
