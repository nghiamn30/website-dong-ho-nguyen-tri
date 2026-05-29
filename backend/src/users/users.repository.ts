import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { buildSeedUsers, seedRoles } from './seed-data';
import { PERMISSIONS, RoleCode, RoleRecord, UserRecord } from './user.types';

type PrismaRoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

type PrismaUserWithRoles = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class UsersRepository {
  private memoryRoles = structuredClone(seedRoles);
  private memoryUsers = buildSeedUsers();

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  async seedSystemData(seedUsers = buildSeedUsers()) {
    const prisma = this.getPrisma();

    if (!prisma) {
      this.memoryRoles = structuredClone(seedRoles);
      this.memoryUsers = structuredClone(seedUsers);
      return;
    }

    for (const permissionCode of Object.values(PERMISSIONS)) {
      await prisma.permission.upsert({
        where: { code: permissionCode },
        update: { name: permissionCode },
        create: {
          code: permissionCode,
          name: permissionCode,
        },
      });
    }

    for (const role of seedRoles) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: { name: role.name },
        create: {
          code: role.code,
          name: role.name,
        },
      });

      await prisma.rolePermission.deleteMany({
        where: {
          roleCode: role.code,
          permissionCode: {
            notIn: role.permissions,
          },
        },
      });

      for (const permissionCode of role.permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleCode_permissionCode: {
              roleCode: role.code,
              permissionCode,
            },
          },
          update: {},
          create: {
            roleCode: role.code,
            permissionCode,
          },
        });
      }
    }

    for (const seedUser of seedUsers) {
      const user = await prisma.user.upsert({
        where: { employeeCode: seedUser.employeeCode },
        update: {
          name: seedUser.name,
        },
        create: {
          id: getSeedUserId(seedUser.employeeCode),
          employeeCode: seedUser.employeeCode,
          name: seedUser.name,
          passwordHash: seedUser.passwordHash,
          isActive: seedUser.isActive,
        },
      });

      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          roleCode: {
            notIn: seedUser.roleCodes,
          },
        },
      });

      for (const roleCode of seedUser.roleCodes) {
        await prisma.userRole.upsert({
          where: {
            userId_roleCode: {
              userId: user.id,
              roleCode,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleCode,
          },
        });
      }
    }
  }

  async findUserByEmployeeCode(
    employeeCode: string,
  ): Promise<UserRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const user = await prisma.user.findUnique({
        where: { employeeCode },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return user ? toUserRecord(user) : null;
    }

    return (
      this.memoryUsers.find((user) => user.employeeCode === employeeCode) ??
      null
    );
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const prisma = this.getPrisma();

    if (prisma) {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return user ? toUserRecord(user) : null;
    }

    return this.memoryUsers.find((user) => user.id === id) ?? null;
  }

  async listUsers(): Promise<UserRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const users = await prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { employeeCode: 'asc' },
      });

      return users.map(toUserRecord);
    }

    return structuredClone(this.memoryUsers).sort((left, right) =>
      left.employeeCode.localeCompare(right.employeeCode),
    );
  }

  async listRoles(): Promise<RoleRecord[]> {
    const prisma = this.getPrisma();

    if (prisma) {
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });

      return roles.map(toRoleRecord);
    }

    return structuredClone(this.memoryRoles).sort((left, right) =>
      left.code.localeCompare(right.code),
    );
  }

  async employeeCodeExists(employeeCode: string): Promise<boolean> {
    const prisma = this.getPrisma();

    if (prisma) {
      const count = await prisma.user.count({
        where: { employeeCode },
      });

      return count > 0;
    }

    return this.memoryUsers.some((user) => user.employeeCode === employeeCode);
  }

  async createUser(user: UserRecord): Promise<UserRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const created = await prisma.user.create({
        data: {
          id: user.id,
          employeeCode: user.employeeCode,
          name: user.name,
          passwordHash: user.passwordHash,
          isActive: user.isActive,
          roles: {
            create: user.roleCodes.map((roleCode) => ({ roleCode })),
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return toUserRecord(created);
    }

    this.memoryUsers.push(structuredClone(user));
    return structuredClone(user);
  }

  async updateUser(
    userId: string,
    input: {
      name?: string;
      roleCode?: RoleCode;
    },
  ): Promise<UserRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const updated = await prisma.$transaction(async (tx) => {
        if (input.name !== undefined) {
          await tx.user.update({
            where: { id: userId },
            data: {
              name: input.name,
            },
          });
        }

        if (input.roleCode) {
          await tx.userRole.deleteMany({ where: { userId } });
          await tx.userRole.create({
            data: {
              userId,
              roleCode: input.roleCode,
            },
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id: userId },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });
      });

      return toUserRecord(updated);
    }

    const user = this.findMemoryUserOrThrow(userId);

    if (input.name !== undefined) {
      user.name = input.name;
    }

    if (input.roleCode) {
      user.roleCodes = [input.roleCode];
    }

    user.updatedAt = new Date().toISOString();
    return structuredClone(user);
  }

  async setUserStatus(userId: string, isActive: boolean): Promise<UserRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return toUserRecord(updated);
    }

    const user = this.findMemoryUserOrThrow(userId);
    user.isActive = isActive;
    user.updatedAt = new Date().toISOString();
    return structuredClone(user);
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
  ): Promise<UserRecord> {
    const prisma = this.getPrisma();

    if (prisma) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return toUserRecord(updated);
    }

    const user = this.findMemoryUserOrThrow(userId);
    user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();
    return structuredClone(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const prisma = this.getPrisma();

    if (prisma) {
      await prisma.user.delete({ where: { id: userId } });
      return;
    }

    const index = this.memoryUsers.findIndex((item) => item.id === userId);

    if (index >= 0) {
      this.memoryUsers.splice(index, 1);
    }
  }

  countUserReferences(employeeCode: string): Promise<UserReferenceUsage[]> {
    void employeeCode;
    return Promise.resolve([]);
  }

  async countUsersWithRole(roleCode: RoleCode): Promise<number> {
    const prisma = this.getPrisma();

    if (prisma) {
      return prisma.user.count({
        where: { roles: { some: { roleCode } } },
      });
    }

    return this.memoryUsers.filter((user) => user.roleCodes.includes(roleCode))
      .length;
  }

  private findMemoryUserOrThrow(userId: string) {
    const user = this.memoryUsers.find((item) => item.id === userId);

    if (!user) {
      throw new Error(`User ${userId} not found in memory repository.`);
    }

    return user;
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

export interface UserReferenceUsage {
  label: string;
  count: number;
}

function toRoleRecord(role: PrismaRoleWithPermissions): RoleRecord {
  return {
    code: role.code as RoleCode,
    name: role.name,
    permissions: role.permissions
      .map((permissionLink) => permissionLink.permission.code)
      .sort() as RoleRecord['permissions'],
  };
}

function toUserRecord(user: PrismaUserWithRoles): UserRecord {
  return {
    id: user.id,
    employeeCode: user.employeeCode,
    name: user.name,
    passwordHash: user.passwordHash,
    roleCodes: user.roles
      .map((roleLink) => roleLink.role.code as RoleCode)
      .sort(),
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function getSeedUserId(employeeCode: string) {
  const seedUserIds: Record<string, string> = {
    ADMIN001: '00000000-0000-4000-8000-000000000001',
  };

  return seedUserIds[employeeCode] ?? randomUUID();
}
