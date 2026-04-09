import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import fastifyCookie from '@fastify/cookie';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '@/app.module';
import { EnvConfig } from '@/config/env.config';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

export async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    {
      rawBody: true,
    },
  );

  const configService = app.get(ConfigService<EnvConfig, true>);
  const cookieSecret = configService.getOrThrow('cookieSecret', {
    infer: true,
  });
  const allowedCorsOrigins = configService.getOrThrow('allowedCorsOrigins', {
    infer: true,
  });

  await app.register(fastifyCookie, {
    secret: cookieSecret,
  });

  app.enableCors({
    origin: allowedCorsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}
