import { AppModule } from '@/app.module'
import { EnvConfig } from '@/config/env.config'
import fastifyCookie from '@fastify/cookie'
import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { Logger } from 'nestjs-pino'

let app: NestFastifyApplication | null = null

async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile()

  const nextApp = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { rawBody: true })

  const configService = nextApp.get(ConfigService<EnvConfig, true>)
  const logger = nextApp.get(Logger)

  nextApp.useLogger(logger)

  const cookieSecret = configService.getOrThrow('cookieSecret', { infer: true })
  const allowedCorsOrigins = configService.getOrThrow('allowedCorsOrigins', { infer: true })

  await nextApp.register(fastifyCookie, {
    secret: cookieSecret
  })

  nextApp.enableCors({
    origin: allowedCorsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  })

  nextApp.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'readiness', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET }
    ]
  })

  nextApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  )

  await nextApp.init()
  await nextApp.getHttpAdapter().getInstance().ready()

  return nextApp
}

export async function getSharedTestApp(): Promise<NestFastifyApplication> {
  if (!app) {
    app = await createTestApp()
  }

  return app
}

export async function closeSharedTestApp(): Promise<void> {
  if (!app) {
    return
  }

  await app.close()
  app = null
}
