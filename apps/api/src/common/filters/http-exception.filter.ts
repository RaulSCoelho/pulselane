import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const message =
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception
        ? (exception.message as string | string[])
        : undefined;

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
              message: response.message ?? message,
            };

      reply.status(statusCode).send({
        ...normalizedResponse,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: message || 'Unexpected internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
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
