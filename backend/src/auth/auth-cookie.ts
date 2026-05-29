import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export const AUTH_COOKIE_NAME = 'dong_ho_nguyen_tri_access_token';

const DEFAULT_MAX_AGE_SECONDS = 8 * 60 * 60;

export function buildAuthCookie(
  token: string,
  configService: ConfigService,
): string {
  return serializeCookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: parseJwtMaxAgeSeconds(configService.get<string>('JWT_EXPIRES_IN')),
    path: '/',
    sameSite: 'Lax',
    secure: isSecureCookie(configService),
  });
}

export function buildClearAuthCookie(configService: ConfigService): string {
  return serializeCookie(AUTH_COOKIE_NAME, '', {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    secure: isSecureCookie(configService),
  });
}

export function extractAuthCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = cookie.trim().split('=');

    if (rawName !== AUTH_COOKIE_NAME) {
      continue;
    }

    const rawValue = rawValueParts.join('=');

    try {
      return rawValue ? decodeURIComponent(rawValue) : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: 'Lax' | 'Strict' | 'None';
    secure?: boolean;
  },
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  return parts.join('; ');
}

function isSecureCookie(configService: ConfigService) {
  const configured = configService.get<string>('AUTH_COOKIE_SECURE');

  if (configured !== undefined) {
    return ['true', '1', 'yes', 'on'].includes(configured.trim().toLowerCase());
  }

  return (
    configService
      .get<string>('FRONTEND_ORIGIN')
      ?.trim()
      .startsWith('https://') ?? false
  );
}

function parseJwtMaxAgeSeconds(value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return DEFAULT_MAX_AGE_SECONDS;
  }

  const match = normalized.match(/^(\d+)([smhd])?$/i);

  if (!match) {
    return DEFAULT_MAX_AGE_SECONDS;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? 's';
  const multiplier =
    unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;

  return amount * multiplier;
}
