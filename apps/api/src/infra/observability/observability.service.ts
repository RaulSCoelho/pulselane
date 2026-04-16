import type { EnvConfig } from '@/config/env.config'
import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Sentry from '@sentry/node'
import type { FastifyRequest } from 'fastify'

type CaptureHttpContextParams = {
  request?: FastifyRequest
  exception?: unknown
  level?: 'error' | 'warning' | 'info'
  extras?: Record<string, unknown>
}

@Injectable()
export class ObservabilityService implements OnModuleInit, OnApplicationShutdown {
  private readonly sentryEnabled: boolean
  private initialized = false
  private handlersBound = false

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.sentryEnabled = this.configService.getOrThrow('sentryEnabled', { infer: true })
  }

  onModuleInit() {
    if (!this.sentryEnabled || this.initialized) {
      return
    }

    Sentry.init({
      dsn: this.configService.getOrThrow('sentryDsn', { infer: true }),
      environment: this.configService.getOrThrow('sentryEnvironment', { infer: true }),
      release: this.configService.get('sentryRelease', { infer: true }) || undefined,
      tracesSampleRate: this.configService.getOrThrow('sentryTracesSampleRate', { infer: true }),
      sendDefaultPii: false
    })

    this.initialized = true
    this.bindProcessHandlers()
  }

  async onApplicationShutdown() {
    if (!this.sentryEnabled || !this.initialized) {
      return
    }

    await Sentry.flush(2000)
  }

  isEnabled() {
    return this.sentryEnabled
  }

  applyRequestContext(request: FastifyRequest) {
    if (!this.sentryEnabled) {
      return
    }

    const currentUser = request.user
    const organizationId = this.extractOrganizationId(request)

    const scope = Sentry.getIsolationScope()

    scope.setTag('request_id', String(request.id))
    scope.setTag('http_method', request.method)
    scope.setTag('http_path', request.url)

    if (organizationId) {
      scope.setTag('organization_id', organizationId)
    }

    scope.setContext('request', {
      id: request.id,
      method: request.method,
      path: request.url,
      organizationId
    })

    if (currentUser?.sub) {
      scope.setUser({
        id: currentUser.sub
      })
      scope.setTag('user_id', currentUser.sub)
    }
  }

  captureHttpException(params: CaptureHttpContextParams) {
    if (!this.sentryEnabled || !params.exception) {
      return
    }

    const request = params.request
    const currentUser = request?.user
    const organizationId = request ? this.extractOrganizationId(request) : undefined

    Sentry.captureException(params.exception, {
      level: params.level ?? 'error',
      tags: {
        ...(request
          ? {
              request_id: String(request.id),
              http_method: request.method,
              http_path: request.url
            }
          : {}),
        ...(currentUser?.sub ? { user_id: currentUser.sub } : {}),
        ...(organizationId ? { organization_id: organizationId } : {})
      },
      user: currentUser?.sub
        ? {
            id: currentUser.sub
          }
        : undefined,
      contexts: {
        ...(request
          ? {
              request: {
                id: request.id,
                method: request.method,
                path: request.url,
                organizationId
              }
            }
          : {})
      },
      extra: params.extras
    })
  }

  private bindProcessHandlers() {
    if (this.handlersBound) {
      return
    }

    process.on('unhandledRejection', reason => {
      this.captureHttpException({
        exception: reason instanceof Error ? reason : new Error(`Unhandled rejection: ${String(reason)}`),
        level: 'error',
        extras: {
          source: 'process.unhandledRejection'
        }
      })
    })

    process.on('uncaughtExceptionMonitor', error => {
      this.captureHttpException({
        exception: error,
        level: 'error',
        extras: {
          source: 'process.uncaughtExceptionMonitor'
        }
      })
    })

    this.handlersBound = true
  }

  private extractOrganizationId(request: FastifyRequest): string | undefined {
    const header = request.headers['x-organization-id']

    if (typeof header === 'string') {
      return header
    }

    if (Array.isArray(header)) {
      return header[0]
    }

    return undefined
  }
}
