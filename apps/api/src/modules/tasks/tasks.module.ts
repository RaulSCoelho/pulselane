import { Module } from '@nestjs/common';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { UserModule } from '@/modules/user/user.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';

@Module({
  imports: [MembershipModule, ProjectsModule, UserModule],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
})
export class TasksModule {}
