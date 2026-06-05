import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AuditLogRepository } from './audit-log.repository';
import {
  AuditLogEntry,
  AuditLogFilter,
  AuditLogInput,
} from './audit-log.types';

@Injectable()
export class AuditLogService {
  private readonly memoryLimit: number;

  constructor(
    configService: ConfigService,
    private readonly auditLogRepository: AuditLogRepository,
  ) {
    this.memoryLimit = Number(
      configService.get<string>('AUDIT_LOG_MEMORY_LIMIT') ?? 2000,
    );
  }

  async create(input: AuditLogInput): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      action: input.action,
      actorUserId: input.actorUserId,
      employeeCode: input.employeeCode,
      success: input.success,
      important: input.important ?? false,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeData: input.beforeData,
      afterData: input.afterData,
      reason: input.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };

    const result = await this.auditLogRepository.create(entry);
    this.auditLogRepository.trimMemory(this.memoryLimit);
    return result;
  }

  list(filter?: AuditLogFilter): Promise<AuditLogEntry[]> {
    return this.auditLogRepository.list(this.memoryLimit, filter);
  }

  async getSummary() {
    const summary = await this.auditLogRepository.getSummary();

    return {
      ...summary,
      memoryLimit: this.memoryLimit,
    };
  }
}
