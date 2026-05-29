import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { resolveDatabaseConnectionConfig } from './database.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly enabled: boolean;

  constructor(configService: ConfigService) {
    const database = resolveDatabaseConnectionConfig(configService);
    const adapter = new PrismaPg({
      connectionString: database.url ?? buildPostgresUrl(database),
    });

    super({ adapter });
    this.enabled = database.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  async onModuleInit() {
    if (this.enabled) {
      await this.$connect();
    }
  }

  async onModuleDestroy() {
    if (this.enabled) {
      await this.$disconnect();
    }
  }
}

function buildPostgresUrl(database: {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}) {
  const user = encodeURIComponent(database.user);
  const password = encodeURIComponent(database.password);
  const name = encodeURIComponent(database.name);

  return `postgresql://${user}:${password}@${database.host}:${database.port}/${name}?schema=public`;
}
