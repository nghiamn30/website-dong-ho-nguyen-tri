import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  ChangeRequestFilter,
  ChangeRequestRecord,
  CreateChangeRequestInput,
  ReviewChangeRequestInput,
} from './change-requests.types';

type PrismaChangeRequest = Prisma.ChangeRequestGetPayload<object>;

@Injectable()
export class ChangeRequestsRepository {
  private readonly memoryRequests: ChangeRequestRecord[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  async list(filter?: ChangeRequestFilter): Promise<ChangeRequestRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const rows = await prisma.changeRequest.findMany({
        where: {
          status: filter?.status,
          requestedBy: filter?.requestedBy,
          entityType: filter?.entityType,
        },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(toRecord);
    }

    return structuredClone(
      this.memoryRequests
        .filter((request) => matchesFilter(request, filter))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    );
  }

  async findById(id: string): Promise<ChangeRequestRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const row = await prisma.changeRequest.findUnique({ where: { id } });
      return row ? toRecord(row) : null;
    }

    return (
      structuredClone(
        this.memoryRequests.find((request) => request.id === id),
      ) ?? null
    );
  }

  async create(input: CreateChangeRequestInput): Promise<ChangeRequestRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const created = await prisma.changeRequest.create({
        data: {
          requestedBy: input.requestedBy,
          entityType: input.entityType,
          entityId: input.entityId,
          requestType: input.requestType,
          proposedData: toPrismaJson(input.proposedData),
          reason: input.reason,
        },
      });
      return toRecord(created);
    }

    const now = new Date().toISOString();
    const record: ChangeRequestRecord = {
      id: randomUUID(),
      requestedBy: input.requestedBy,
      entityType: input.entityType,
      entityId: input.entityId,
      requestType: input.requestType,
      proposedData: structuredClone(input.proposedData),
      reason: input.reason,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.memoryRequests.push(record);
    return structuredClone(record);
  }

  async review(
    id: string,
    input: ReviewChangeRequestInput,
  ): Promise<ChangeRequestRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const updated = await prisma.changeRequest.update({
        where: { id },
        data: {
          status: input.status,
          reviewedBy: input.reviewedBy,
          reviewedAt: input.reviewedAt,
          reviewNote: input.reviewNote,
        },
      });
      return toRecord(updated);
    }

    const request = this.memoryRequests.find((item) => item.id === id);
    if (!request) {
      throw new Error(`Change request ${id} not found in memory repository.`);
    }
    request.status = input.status;
    request.reviewedBy = input.reviewedBy;
    request.reviewedAt = input.reviewedAt;
    request.reviewNote = input.reviewNote;
    request.updatedAt = new Date().toISOString();
    return structuredClone(request);
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function matchesFilter(
  request: ChangeRequestRecord,
  filter?: ChangeRequestFilter,
): boolean {
  if (!filter) return true;
  if (filter.status && request.status !== filter.status) return false;
  if (filter.requestedBy && request.requestedBy !== filter.requestedBy) {
    return false;
  }
  if (filter.entityType && request.entityType !== filter.entityType) {
    return false;
  }
  return true;
}

function toRecord(row: PrismaChangeRequest): ChangeRequestRecord {
  return {
    id: row.id,
    requestedBy: row.requestedBy,
    entityType: row.entityType,
    entityId: row.entityId ?? undefined,
    requestType: row.requestType,
    proposedData: normalizeJson(row.proposedData),
    reason: row.reason ?? undefined,
    status: row.status,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: row.reviewedAt?.toISOString(),
    reviewNote: row.reviewNote ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeJson(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
