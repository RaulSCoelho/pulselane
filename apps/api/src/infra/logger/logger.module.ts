import type { EnvConfig } from '@/config/env.config'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import type { FastifyRequest } from 'fastify'
import { LoggerModule as NestjsPinoModule, Params } from 'nestjs-pino'
import { randomUUID } from 'node:crypto'

function getHeaderValue(header: string | string[] | undefined) {
  if (typeof header === 'string') {
    return header
  }

  if (Array.isArray(header) && typeof header[0] === 'string') {
    return header[0]
  }

  return undefined
}

function getRequestContext(request: unknown) {
  const enrichedRequest = request as FastifyRequest

  return {
    requestId: enrichedRequest.id,
    userId: enrichedRequest.user?.sub,
    organizationId: getHeaderValue(enrichedRequest.headers['x-organization-id']),
    incomingRequestId: getHeaderValue(enrichedRequest.headers['x-request-id'])
  }
}

@Module({
  imports: [
    ConfigModule,
    NestjsPinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>): Params => {
        const nodeEnv = configService.getOrThrow('nodeEnv', { infer: true })
        const logLevel = configService.getOrThrow('logLevel', { infer: true })

        const baseParams: Params = {
          pinoHttp: {
            level: logLevel,
            genReqId: (request, reply) => {
              const { incomingRequestId } = getRequestContext(request)

              const requestId =
                incomingRequestId && incomingRequestId.trim().length > 0 ? incomingRequestId : randomUUID()

              if (typeof reply.setHeader === 'function') {
                reply.setHeader('x-request-id', requestId)
              }

              return requestId
            },
            customLogLevel: (_request, reply, error) => {
              if (error || reply.statusCode >= 500) {
                return 'error'
              }

              if (reply.statusCode >= 400) {
                return 'warn'
              }

              return 'info'
            },
            customProps: request => {
              const { requestId, userId, organizationId } = getRequestContext(request)

              return {
                request_id: requestId,
                user_id: userId,
                organization_id: organizationId,
                module: 'http'
              }
            },
            messageKey: 'message',
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
              censor: '[redacted]'
            }
          }
        }

        if (nodeEnv === 'development') {
          return {
            ...baseParams,
            pinoHttp: {
              ...baseParams.pinoHttp,
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard'
                }
              }
            }
          }
        }

        if (nodeEnv === 'test') {
          return {
            ...baseParams,
            pinoHttp: {
              ...baseParams.pinoHttp,
              level: 'silent',
              autoLogging: false
            }
          }
        }

        return baseParams
      }
    })
  ],
  exports: [NestjsPinoModule]
})
export class AppLoggerModule {}
