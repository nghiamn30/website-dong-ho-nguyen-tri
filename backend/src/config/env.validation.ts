import type { ConfigService } from '@nestjs/config';

const LOCAL_JWT_SECRET = 'local-development-secret-change-before-production';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

type ConfigReader = Pick<ConfigService, 'get'>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = normalizeOptional(config.NODE_ENV) ?? 'development';
  const isProduction = nodeEnv === 'production';
  const jwtSecret = normalizeOptional(config.JWT_SECRET);
  const dbEnabled = normalizeOptional(config.DB_ENABLED);

  if (dbEnabled && parseBooleanEnv(dbEnabled) === undefined) {
    throw new Error(
      'DB_ENABLED must be one of true, false, 1, 0, yes, no, on, off.',
    );
  }

  if (isProduction) {
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required in production.');
    }

    if (
      jwtSecret.length < MIN_PRODUCTION_SECRET_LENGTH ||
      jwtSecret === 'dev-secret'
    ) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production.`,
      );
    }

    if (parseBooleanEnv(dbEnabled) !== true) {
      throw new Error('DB_ENABLED=true is required in production.');
    }
  }

  return config;
}

export function resolveJwtSecret(configService: ConfigReader): string {
  const jwtSecret = normalizeOptional(configService.get<string>('JWT_SECRET'));

  if (jwtSecret) {
    return jwtSecret;
  }

  if (configService.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET is required in production.');
  }

  return LOCAL_JWT_SECRET;
}

export function parseBooleanEnv(
  value: string | undefined,
): boolean | undefined {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function normalizeOptional(value: unknown) {
  const trimmed = typeof value === 'string' ? value.trim() : undefined;
  return trimmed ? trimmed : undefined;
}
