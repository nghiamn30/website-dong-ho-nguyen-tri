import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveDatabaseConfig } from './database/database.config';

const SERVICE_NAME = 'website-dong-ho-nguyen-tri-backend';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getPublicHealth() {
    return {
      name: SERVICE_NAME,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    const database = resolveDatabaseConfig(this.configService);

    return {
      name: SERVICE_NAME,
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      environment: {
        nodeEnv: this.configService.get<string>('NODE_ENV') ?? 'development',
        port: Number(this.configService.get<string>('PORT') ?? 3001),
        frontendOrigin:
          this.configService.get<string>('FRONTEND_ORIGIN') ??
          'http://localhost:3000',
      },
      database: {
        enabled: database.enabled,
        mode: database.mode,
        orm: database.orm,
        host: database.host,
        port: database.port,
        name: database.name,
      },
      audit: {
        memoryLimit: Number(
          this.configService.get<string>('AUDIT_LOG_MEMORY_LIMIT') ?? 2000,
        ),
      },
    };
  }
}
