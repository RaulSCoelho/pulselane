import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { PrismaService } from './infra/prisma/prisma.service';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './config/env.config';
import {
  DEVICE_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from './modules/auth/infra/auth.constants';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { rawBody: true },
  );

  const configService = app.get(ConfigService<EnvConfig>);
  const port = configService.getOrThrow<number>('port');
  const nodeEnv = configService.getOrThrow<string>('nodeEnv');
  const allowedCorsOrigins =
    configService.getOrThrow<string[]>('allowedCorsOrigins');
  const cookieSecret = configService.getOrThrow<string>('cookieSecret');

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pulselane API')
    .setDescription('Multi-tenant operations SaaS API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addCookieAuth(REFRESH_COOKIE_NAME)
    .addCookieAuth(DEVICE_COOKIE_NAME)
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(port, '0.0.0.0');

  Logger.log(`📦 Environment: ${nodeEnv}`, 'Bootstrap');
  Logger.log(
    `🌐 Allowed CORS Origins: ${allowedCorsOrigins.join(', ')}`,
    'Bootstrap',
  );
  Logger.log(
    `🚀 Server is up and running at: ${await app.getUrl()}`,
    'Bootstrap',
  );
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
