import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { PinoLogger } from 'nestjs-pino'

type HttpExceptionResponse =
  | string
  | {
      message?: string | string[]
      error?: string
      statusCode?: number
    }

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const request = context.getRequest<FastifyRequest>()
    const reply = context.getResponse<FastifyReply>()

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const response = exception.getResponse() as HttpExceptionResponse

      const normalizedResponse =
        typeof response === 'string'
          ? {
              statusCode,
              error: this.getDefaultErrorName(statusCode),
              message: response
            }
          : {
              statusCode: response.statusCode ?? statusCode,
              error: response.error ?? this.getDefaultErrorName(statusCode),
              message: response.message ?? exception.message
            }

      if (statusCode >= 500) {
        this.logger.error({
          message: 'Unhandled HTTP exception',
          module: 'http',
          method: request.method,
          path: request.url,
          request_id: request.id,
          status_code: statusCode,
          stack: exception.stack
        })
      }

      reply.status(statusCode).send({
        ...normalizedResponse,
        path: request.url,
        timestamp: new Date().toISOString()
      })

      return
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaResponse = this.mapPrismaError(exception)

      reply.status(prismaResponse.statusCode).send({
        ...prismaResponse,
        path: request.url,
        timestamp: new Date().toISOString()
      })

      return
    }

    this.logger.error({
      message: 'Unhandled exception',
      module: 'http',
      method: request.method,
      path: request.url,
      request_id: request.id,
      stack: exception instanceof Error ? exception.stack : undefined
    })

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Unexpected internal server error',
      path: request.url,
      timestamp: new Date().toISOString()
    })
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number
    error: string
    message: string | string[]
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A unique field value already exists'
        }

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Requested resource was not found'
        }

      default:
        this.logger.error({
          message: 'Unhandled Prisma error',
          module: 'database',
          prisma_code: exception.code,
          stack: exception.stack
        })

        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Unexpected database error'
        }
    }
  }

  private getDefaultErrorName(statusCode: number): string {
    const statusMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error'
    }

    return statusMap[statusCode] ?? 'Error'
  }
}
