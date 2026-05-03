import fastifyCookie from '@fastify/cookie'
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'
import { EnvConfig, configuration } from './config/env.config'
import { PrismaService } from './infra/prisma/prisma.service'
import { DEVICE_COOKIE_NAME, REFRESH_COOKIE_NAME } from './modules/auth/auth.constants'

async function bootstrap() {
  const bootstrapConfig = configuration()
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: bootstrapConfig.trustProxy }),
    { rawBody: true }
  )

  const configService = app.get(ConfigService<EnvConfig, true>)
  const logger = app.get(Logger)

  app.useLogger(logger)

  const port = configService.getOrThrow('port', { infer: true })
  const nodeEnv = configService.getOrThrow('nodeEnv', { infer: true })
  const allowedCorsOrigins = configService.getOrThrow('allowedCorsOrigins', { infer: true })
  const trustProxy = configService.getOrThrow('trustProxy', { infer: true })
  const cookieSecret = configService.getOrThrow('cookieSecret', { infer: true })

  await app.register(fastifyCookie, {
    secret: cookieSecret
  })

  app.enableCors({
    origin: allowedCorsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  })

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'db-warmup', method: RequestMethod.GET },
      { path: 'db-heartbeat', method: RequestMethod.GET },
      { path: 'readiness', method: RequestMethod.GET },
      { path: 'redis-health', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET }
    ]
  })

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
  await prismaService.enableShutdownHooks(app)

  await app.listen(port, '0.0.0.0')

  logger.log({
    message: 'API server started',
    module: 'bootstrap',
    environment: nodeEnv,
    port,
    url: await app.getUrl(),
    allowed_cors_origins: allowedCorsOrigins,
    trust_proxy: trustProxy
  })
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
