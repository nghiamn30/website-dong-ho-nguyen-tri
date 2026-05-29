import { ConfigService } from '@nestjs/config';
import { parseBooleanEnv } from '../config/env.validation';

type ConfigReader = Pick<ConfigService, 'get'>;

export interface ResolvedDatabaseConfig {
  enabled: boolean;
  mode: 'postgres' | 'in-memory';
  orm: 'prisma';
  host: string;
  port: number;
  name: string;
  url?: string;
}

export interface ResolvedDatabaseConnectionConfig extends ResolvedDatabaseConfig {
  user: string;
  password: string;
}

export function resolveDatabaseConfig(
  configService: ConfigReader,
): ResolvedDatabaseConfig {
  const { user, password, ...metadata } =
    resolveDatabaseConnectionConfig(configService);
  void user;
  void password;

  return metadata;
}

export function resolveDatabaseConnectionConfig(
  configService: ConfigReader,
): ResolvedDatabaseConnectionConfig {
  const url = normalizeOptional(configService.get<string>('DATABASE_URL'));
  const parsedUrl = url ? parsePostgresUrl(url) : undefined;
  const enabled = isDatabaseEnabled(configService.get<string>('DB_ENABLED'));

  return {
    enabled,
    mode: enabled ? 'postgres' : 'in-memory',
    orm: 'prisma',
    host:
      parsedUrl?.host ??
      normalizeOptional(configService.get<string>('DB_HOST')) ??
      'localhost',
    port:
      parsedUrl?.port ?? Number(configService.get<string>('DB_PORT') ?? 5432),
    name:
      parsedUrl?.name ??
      normalizeOptional(configService.get<string>('DB_NAME')) ??
      'dong_ho_nguyen_tri',
    user:
      parsedUrl?.user ??
      normalizeOptional(configService.get<string>('DB_USER')) ??
      'postgres',
    password:
      parsedUrl?.password ??
      normalizeOptional(configService.get<string>('DB_PASSWORD')) ??
      'postgres',
    url,
  };
}

export function isDatabaseEnabled(value: string | undefined) {
  return parseBooleanEnv(value) === true;
}

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parsePostgresUrl(value: string) {
  try {
    const parsed = new URL(value);

    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      return undefined;
    }

    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username || 'postgres'),
      password: decodeURIComponent(parsed.password || 'postgres'),
      name: normalizeOptional(
        decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      ),
    };
  } catch {
    return undefined;
  }
}
