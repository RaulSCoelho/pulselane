import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

type HttpExceptionResponse =
  | string
  | {
      message?: string | string[];
      error?: string;
      statusCode?: number;
    };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse() as HttpExceptionResponse;

      const normalizedResponse =
        typeof response === 'string'
          ? {
              statusCode,
              error: this.getDefaultErrorName(statusCode),
              message: response,
            }
          : {
              statusCode: response.statusCode ?? statusCode,
              error: response.error ?? this.getDefaultErrorName(statusCode),
              message: response.message ?? exception.message,
            };

      reply.status(statusCode).send({
        ...normalizedResponse,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaResponse = this.mapPrismaError(exception);

      reply.status(prismaResponse.statusCode).send({
        ...prismaResponse,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Unexpected internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A unique field value already exists',
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Requested resource was not found',
        };

      default:
        this.logger.error(
          `Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );

        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Unexpected database error',
        };
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
      500: 'Internal Server Error',
    };

    return statusMap[statusCode] ?? 'Error';
  }
}
