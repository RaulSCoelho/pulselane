import { PrismaService } from '@/infra/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    }
  }

  async getReadiness() {
    let databaseOk = false

    try {
      await this.prisma.$queryRaw`SELECT 1`
      databaseOk = true
    } catch {
      databaseOk = false
    }

    return {
      status: databaseOk ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseOk ? 'ok' : 'error'
      }
    }
  }
}
