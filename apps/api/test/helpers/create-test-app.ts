import { AppModule } from '@/app.module'
import { EnvConfig } from '@/config/env.config'
import fastifyCookie from '@fastify/cookie'
import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { Logger } from 'nestjs-pino'

export async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { rawBody: true })

  const configService = app.get(ConfigService<EnvConfig, true>)
  const logger = app.get(Logger)

  app.useLogger(logger)

  const cookieSecret = configService.getOrThrow('cookieSecret', { infer: true })
  const allowedCorsOrigins = configService.getOrThrow('allowedCorsOrigins', { infer: true })

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
      { path: 'readiness', method: RequestMethod.GET }
    ]
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  )

  await app.init()
  await app.getHttpAdapter().getInstance().ready()

  return app
}
