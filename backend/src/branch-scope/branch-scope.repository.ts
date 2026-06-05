import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  BranchScopedRoleRecord,
  CreateBranchScopedRoleInput,
} from './branch-scope.types';

type PrismaBranchScopedRole = Prisma.BranchScopedRoleGetPayload<object>;

@Injectable()
export class BranchScopeRepository {
  private readonly memoryRoles: BranchScopedRoleRecord[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  async list(): Promise<BranchScopedRoleRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const rows = await prisma.branchScopedRole.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(toRecord);
    }

    return structuredClone(this.memoryRoles);
  }

  async listByUser(userId: string): Promise<BranchScopedRoleRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const rows = await prisma.branchScopedRole.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(toRecord);
    }

    return structuredClone(
      this.memoryRoles.filter((role) => role.userId === userId),
    );
  }

  async findById(id: string): Promise<BranchScopedRoleRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const row = await prisma.branchScopedRole.findUnique({ where: { id } });
      return row ? toRecord(row) : null;
    }

    return (
      structuredClone(this.memoryRoles.find((role) => role.id === id)) ?? null
    );
  }

  async exists(input: CreateBranchScopedRoleInput): Promise<boolean> {
    const prisma = this.getPrisma();

    if (prisma) {
      const count = await prisma.branchScopedRole.count({
        where: {
          userId: input.userId,
          roleCode: input.roleCode,
          branchId: input.branchId,
        },
      });
      return count > 0;
    }

    return this.memoryRoles.some(
      (role) =>
        role.userId === input.userId &&
        role.roleCode === input.roleCode &&
        role.branchId === input.branchId,
    );
  }

  async create(
    input: CreateBranchScopedRoleInput,
  ): Promise<BranchScopedRoleRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const created = await prisma.branchScopedRole.create({
        data: {
          userId: input.userId,
          roleCode: input.roleCode,
          branchId: input.branchId,
        },
      });
      return toRecord(created);
    }

    const now = new Date().toISOString();
    const record: BranchScopedRoleRecord = {
      id: randomUUID(),
      userId: input.userId,
      roleCode: input.roleCode,
      branchId: input.branchId,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryRoles.push(record);
    return structuredClone(record);
  }

  async delete(id: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.branchScopedRole.delete({ where: { id } });
      return;
    }

    const index = this.memoryRoles.findIndex((role) => role.id === id);
    if (index >= 0) {
      this.memoryRoles.splice(index, 1);
    }
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function toRecord(row: PrismaBranchScopedRole): BranchScopedRoleRecord {
  return {
    id: row.id,
    userId: row.userId,
    roleCode: row.roleCode,
    branchId: row.branchId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
