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

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { rawBody: true },
  );

  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pulselane API')
    .setDescription('Multi-tenant operations SaaS API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 3001,
    '0.0.0.0',
  );

  Logger.log(`📦 Environment: ${process.env.NODE_ENV}`, 'Bootstrap');
  Logger.log(`🌐 Allowed CORS Origins: ${''}`, 'Bootstrap');
  Logger.log(
    `🚀 Server is up and running at: ${await app.getUrl()}`,
    'Bootstrap',
  );
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
