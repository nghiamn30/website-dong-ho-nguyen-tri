import { Controller, Get } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../users/user.types';
import { AuditLogService } from './audit-log.service';

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
  listLogs() {
    return this.auditLogService.list();
  }
}
