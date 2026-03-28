import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { rawBody: true },
  );

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
    .addGlobalParameters({
      name: 'x-organization-id',
      in: 'header',
      required: false,
      schema: { type: 'string' },
      description: 'Current organization context',
    })
    .addGlobalResponse({
      status: 500,
      description: 'Internal server error',
    })
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
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
