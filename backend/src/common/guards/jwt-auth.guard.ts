import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { extractAuthCookie } from '../../auth/auth-cookie';
import { resolveJwtSecret } from '../../config/env.validation';
import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

interface AuthTokenPayload {
  sub: string;
  employeeCode: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token =
      this.extractBearerToken(request.headers.authorization) ??
      extractAuthCookie(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Bạn cần đăng nhập để tiếp tục.',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret: resolveJwtSecret(this.configService),
        },
      );
      const user = await this.usersService.findSafeById(payload.sub);

      if (!user) {
        throw new Error('User not found');
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
      });
    }
  }

  private extractBearerToken(authorization?: string): string | undefined {
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
