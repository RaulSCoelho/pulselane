import { Module } from '@nestjs/common';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { configuration } from './config/env.config';
import { envValidationSchema } from './config/env.validation';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { MembershipModule } from './modules/membership/membership.module';
import { InvitationsModule } from './modules/invitations/invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    MembershipModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    AuditLogsModule,
    InvitationsModule,
  ],
})
export class AppModule {}
