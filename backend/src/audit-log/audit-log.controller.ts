import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../users/user.types';
import { AuditLogService } from './audit-log.service';
import { AuditLogFilter } from './audit-log.types';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('summary')
  @Permissions(PERMISSIONS.AUDIT_LOGS_VIEW)
  getSummary() {
    return this.auditLogService.getSummary();
  }

  @Get()
  @Permissions(PERMISSIONS.AUDIT_LOGS_VIEW)
  listLogs(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('success') success?: string,
    @Query('important') important?: string,
  ) {
    const filter: AuditLogFilter = {
      action: normalize(action),
      entityType: normalize(entityType),
      entityId: normalize(entityId),
      success: parseBoolean(success),
      important: parseBoolean(important),
    };

    return this.auditLogService.list(filter);
  }
}

function normalize(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}
