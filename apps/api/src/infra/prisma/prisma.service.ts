import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // Nest may finish request handling before Prisma emits its shutdown event.
    // Closing the app here keeps the HTTP server and Prisma client lifecycle in sync.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
