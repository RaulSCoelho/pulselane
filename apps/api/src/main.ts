import fastifyCookie from '@fastify/cookie'
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { EnvConfig } from './config/env.config'
import { PrismaService } from './infra/prisma/prisma.service'
import { DEVICE_COOKIE_NAME, REFRESH_COOKIE_NAME } from './modules/auth/auth.constants'

async function bootstrap() {
  // The API runs on Fastify so cookie handling and Swagger are configured here
  // instead of relying on the default Express bootstrap path from Nest starters.
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { rawBody: true })

  const configService = app.get(ConfigService<EnvConfig, true>)
  const port = configService.getOrThrow('port', { infer: true })
  const nodeEnv = configService.getOrThrow('nodeEnv', { infer: true })
  const allowedCorsOrigins = configService.getOrThrow('allowedCorsOrigins', {
    infer: true
  })
  const cookieSecret = configService.getOrThrow('cookieSecret', {
    infer: true
  })

  await app.register(fastifyCookie, {
    secret: cookieSecret
  })

  app.enableCors({
    origin: allowedCorsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  })

  app.setGlobalPrefix('api')

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  )

  app.useGlobalFilters(new HttpExceptionFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pulselane API')
    .setDescription('Multi-tenant operations SaaS API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addCookieAuth(REFRESH_COOKIE_NAME)
    .addCookieAuth(DEVICE_COOKIE_NAME)
    .build()

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)

  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true
    }
  })

  const prismaService = app.get(PrismaService)
  // Prisma does not automatically integrate with Nest shutdown, so we wire the
  // database client into the app lifecycle during bootstrap.
  await prismaService.enableShutdownHooks(app)

  await app.listen(port, '0.0.0.0')

  Logger.log(`📦 Environment: ${nodeEnv}`, 'Bootstrap')
  Logger.log(`🌐 Allowed CORS Origins: ${allowedCorsOrigins.join(', ')}`, 'Bootstrap')
  Logger.log(`🚀 Server is up and running at: ${await app.getUrl()}`, 'Bootstrap')
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
