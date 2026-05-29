import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userPermissions = new Set(request.user?.permissions ?? []);
    const allowed = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!allowed) {
      await this.auditPermissionDenied(request, requiredPermissions);

      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện thao tác này.',
        requiredPermissions,
      });
    }

    return true;
  }

  private async auditPermissionDenied(
    request: RequestWithUser,
    requiredPermissions: string[],
  ) {
    try {
      await this.auditLogService.create({
        action: 'auth.permission_denied',
        actorUserId: request.user?.id,
        employeeCode: request.user?.employeeCode,
        success: false,
        important: true,
        ipAddress: request.ip,
        userAgent: this.getUserAgent(request),
        metadata: {
          method: request.method,
          path: request.originalUrl ?? request.url,
          requiredPermissions,
        },
      });
    } catch {
      // Permission checks must keep their original 403 result even if audit persistence is unavailable.
    }
  }

  private getUserAgent(request: RequestWithUser): string | undefined {
    const userAgent = request.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent;
  }
}
