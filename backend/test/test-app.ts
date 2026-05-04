import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export class TestApp {
  private constructor(
    public readonly app: INestApplication,
    public readonly prisma: PrismaService,
  ) {}

  static async create(): Promise<TestApp> {
    if (process.env['NODE_ENV'] !== 'test') {
      throw new Error(
        `TestApp requires NODE_ENV=test (got: ${process.env['NODE_ENV'] ?? 'undefined'}). ` +
          'Run tests via pnpm scripts that load .env.test.',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    const prisma = app.get(PrismaService);
    return new TestApp(app, prisma);
  }

  getHttpServer(): Server {
    return this.app.getHttpServer() as Server;
  }

  async resetDatabase(): Promise<void> {
    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
    `;

    if (tables.length === 0) return;

    const names = tables.map((t) => `"${t.tablename}"`).join(', ');
    await this.prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`,
    );
  }

  async close(): Promise<void> {
    await this.app.close();
  }
}
