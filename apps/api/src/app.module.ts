import { CanActivate, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'

import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { AppThrottlerGuard } from './common/throttling/app-throttler.guard'
import { type EnvConfig, configuration } from './config/env.config'
import { envValidationSchema } from './config/env.validation'
import { AppLoggerModule } from './infra/logger/logger.module'
import { SlowRequestInterceptor } from './infra/logger/slow-request.interceptor'
import { PrismaModule } from './infra/prisma/prisma.module'
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { ClientsModule } from './modules/clients/clients.module'
import { CommentsModule } from './modules/comments/comments.module'
import { HealthModule } from './modules/health/health.module'
import { InvitationsModule } from './modules/invitations/invitations.module'
import { MembershipModule } from './modules/membership/membership.module'
import { OrganizationModule } from './modules/organization/organization.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { TasksModule } from './modules/tasks/tasks.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => [
        {
          name: 'default',
          ttl: configService.getOrThrow('rateLimitTtlMs', { infer: true }),
          limit: configService.getOrThrow('rateLimitLimit', { infer: true })
        },
        {
          name: 'auth',
          ttl: configService.getOrThrow('authRateLimitTtlMs', { infer: true }),
          limit: configService.getOrThrow('authRateLimitLimit', { infer: true })
        }
      ]
    }),
    PrismaModule,
    AppLoggerModule,
    HealthModule,
    BillingModule,
    AuthModule,
    OrganizationModule,
    MembershipModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    AuditLogsModule,
    InvitationsModule
  ],
  providers: [
    AppThrottlerGuard,
    {
      provide: APP_GUARD,
      inject: [ConfigService, AppThrottlerGuard],
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
        appThrottlerGuard: AppThrottlerGuard
      ): CanActivate => {
        const throttlingEnabled = configService.getOrThrow('throttlingEnabled', { infer: true })

        if (!throttlingEnabled) {
          return {
            canActivate: () => true
          }
        }

        return appThrottlerGuard
      }
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SlowRequestInterceptor
    }
  ]
})
export class AppModule {}
