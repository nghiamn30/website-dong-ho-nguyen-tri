import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { AuditLogEntry } from './audit-log.types';

interface AuditLogSummaryCounts {
  total: number;
  important: number;
  failed: number;
  latestAt?: string;
}

@Injectable()
export class AuditLogRepository {
  private readonly memoryLogs: AuditLogEntry[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.auditLog.create({
        data: {
          id: entry.id,
          action: entry.action,
          actorUserId: entry.actorUserId,
          employeeCode: entry.employeeCode,
          success: entry.success,
          important: entry.important,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: toPrismaJson(entry.metadata),
          createdAt: entry.createdAt,
        },
      });
    } else {
      this.memoryLogs.unshift(structuredClone(entry));
    }

    return entry;
  }

  async list(limit: number): Promise<AuditLogEntry[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map((entry) => ({
        id: entry.id,
        action: entry.action,
        actorUserId: entry.actorUserId ?? undefined,
        employeeCode: entry.employeeCode ?? undefined,
        success: entry.success,
        important: entry.important,
        ipAddress: entry.ipAddress ?? undefined,
        userAgent: entry.userAgent ?? undefined,
        metadata: normalizeMetadata(entry.metadata),
        createdAt: entry.createdAt.toISOString(),
      }));
    }

    return structuredClone(this.memoryLogs.slice(0, limit));
  }

  async getSummary(): Promise<AuditLogSummaryCounts> {
    const prisma = this.getPrisma();

    if (prisma) {
      const [total, important, failed, latest] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { important: true } }),
        prisma.auditLog.count({ where: { success: false } }),
        prisma.auditLog.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      return {
        total,
        important,
        failed,
        latestAt: latest?.createdAt.toISOString(),
      };
    }

    return {
      total: this.memoryLogs.length,
      important: this.memoryLogs.filter((entry) => entry.important).length,
      failed: this.memoryLogs.filter((entry) => !entry.success).length,
      latestAt: this.memoryLogs[0]?.createdAt,
    };
  }

  trimMemory(limit: number) {
    if (this.memoryLogs.length > limit) {
      this.memoryLogs.splice(limit);
    }
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function normalizeMetadata(
  value: unknown,
): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function toPrismaJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  return value
    ? (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue)
    : undefined;
}
