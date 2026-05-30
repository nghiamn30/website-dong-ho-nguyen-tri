import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { buildSeedUsers } from './seed-data';
import {
  PERMISSIONS,
  ROLE_CODES,
  RoleCode,
  RoleRecord,
  UserManagementRecord,
  UserRecord,
} from './user.types';
import {
  CreateUserDto,
  ResetUserPasswordDto,
  SetUserStatusDto,
  UpdateUserDto,
} from './dto/user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.usersRepository.seedSystemData(await this.buildStartupUsers());
  }

  async findByEmployeeCode(employeeCode: string): Promise<UserRecord | null> {
    const normalizedCode = this.normalizeEmployeeCode(employeeCode);
    return this.usersRepository.findUserByEmployeeCode(normalizedCode);
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.usersRepository.findUserById(id);
  }

  async findSafeById(id: string): Promise<RequestUser | null> {
    const user = await this.findById(id);

    if (!user || !user.isActive) {
      return null;
    }

    return this.toSafeUser(user);
  }

  async listUsers(): Promise<UserManagementRecord[]> {
    const [users, roles] = await Promise.all([
      this.usersRepository.listUsers(),
      this.usersRepository.listRoles(),
    ]);

    return users
      .sort((left, right) =>
        left.employeeCode.localeCompare(right.employeeCode),
      )
      .map((user) => this.toManagementUser(user, roles));
  }

  /** Raw account records (including personId) for internal cross-module use. */
  listAccounts(): Promise<UserRecord[]> {
    return this.usersRepository.listUsers();
  }

  async listRoles() {
    const roles = await this.usersRepository.listRoles();

    return roles.map((role) => ({
      code: role.code,
      name: role.name,
      permissions: [...role.permissions],
    }));
  }

  async createUser(dto: CreateUserDto): Promise<UserManagementRecord> {
    const employeeCode = this.normalizeEmployeeCode(dto.employeeCode);
    await this.assertUniqueEmployeeCode(employeeCode);
    const role = await this.findRoleOrThrow(dto.roleCode);
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      employeeCode,
      name: dto.name.trim(),
      passwordHash: bcrypt.hashSync(dto.password, 12),
      roleCodes: [role.code],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.usersRepository.createUser(user);
    return this.toManagementUser(
      created,
      await this.usersRepository.listRoles(),
    );
  }

  async updateUser(
    employeeCode: string,
    dto: UpdateUserDto,
    actor: RequestUser,
  ): Promise<UserManagementRecord> {
    const user = await this.findByEmployeeCodeOrThrow(employeeCode);
    const nextRoleCode = dto.roleCode
      ? (await this.findRoleOrThrow(dto.roleCode)).code
      : undefined;

    if (
      nextRoleCode &&
      user.id === actor.id &&
      user.roleCodes[0] !== nextRoleCode
    ) {
      throw new BadRequestException({
        code: 'SELF_ROLE_CHANGE_BLOCKED',
        message: 'Không thể tự đổi vai trò của chính tài khoản đang đăng nhập.',
      });
    }

    const updated = await this.usersRepository.updateUser(user.id, {
      name: dto.name !== undefined ? dto.name.trim() : undefined,
      roleCode: nextRoleCode,
    });

    return this.toManagementUser(
      updated,
      await this.usersRepository.listRoles(),
    );
  }

  async setUserStatus(
    employeeCode: string,
    dto: SetUserStatusDto,
    actor: RequestUser,
  ): Promise<UserManagementRecord> {
    const user = await this.findByEmployeeCodeOrThrow(employeeCode);

    if (user.id === actor.id && !dto.isActive) {
      throw new BadRequestException({
        code: 'SELF_DEACTIVATE_BLOCKED',
        message: 'Không thể khóa chính tài khoản đang đăng nhập.',
      });
    }

    const updated = await this.usersRepository.setUserStatus(
      user.id,
      dto.isActive,
    );

    return this.toManagementUser(
      updated,
      await this.usersRepository.listRoles(),
    );
  }

  async resetPassword(
    employeeCode: string,
    dto: ResetUserPasswordDto,
    actor: RequestUser,
  ): Promise<UserManagementRecord> {
    const user = await this.findByEmployeeCodeOrThrow(employeeCode);

    if (!this.canChangePassword(user, actor)) {
      throw new ForbiddenException({
        code: 'USER_PASSWORD_CHANGE_FORBIDDEN',
        message: 'Không có quyền đổi mật khẩu tài khoản này.',
      });
    }

    const updated = await this.usersRepository.updatePassword(
      user.id,
      bcrypt.hashSync(dto.password, 12),
    );

    return this.toManagementUser(
      updated,
      await this.usersRepository.listRoles(),
    );
  }

  async deleteUser(
    employeeCode: string,
    actor: RequestUser,
  ): Promise<{ employeeCode: string }> {
    const user = await this.findByEmployeeCodeOrThrow(employeeCode);

    if (user.id === actor.id) {
      throw new BadRequestException({
        code: 'SELF_DELETE_BLOCKED',
        message: 'Không thể xoá chính tài khoản đang đăng nhập.',
      });
    }

    if (user.roleCodes.includes(ROLE_CODES.ADMIN)) {
      const adminCount = await this.usersRepository.countUsersWithRole(
        ROLE_CODES.ADMIN,
      );

      if (adminCount <= 1) {
        throw new ConflictException({
          code: 'LAST_ADMIN_DELETE_BLOCKED',
          message: 'Không thể xoá quản trị viên cuối cùng của hệ thống.',
        });
      }
    }

    const references = await this.usersRepository.countUserReferences(
      user.employeeCode,
    );

    if (references.length > 0) {
      const detail = references
        .map((usage) => `${usage.label} (${usage.count})`)
        .join(', ');

      throw new ConflictException({
        code: 'USER_IN_USE',
        message: `Không thể xoá tài khoản ${user.employeeCode} vì đang được tham chiếu: ${detail}.`,
        references,
      });
    }

    await this.usersRepository.deleteUser(user.id);

    return { employeeCode: user.employeeCode };
  }

  async toSafeUser(user: UserRecord): Promise<RequestUser> {
    const roles = await this.resolveRoles(user.roleCodes);
    const permissions = Array.from(
      new Set(roles.flatMap((role) => role.permissions)),
    );

    return {
      id: user.id,
      employeeCode: user.employeeCode,
      name: user.name,
      personId: user.personId,
      roles: roles.map((role) => ({
        code: role.code,
        name: role.name,
      })),
      permissions,
      defaultPath: this.getDefaultPath(permissions),
    };
  }

  private async resolveRoles(
    roleCodes: UserRecord['roleCodes'],
  ): Promise<RoleRecord[]> {
    const roles = await this.usersRepository.listRoles();

    return roleCodes
      .map((roleCode) => roles.find((role) => role.code === roleCode))
      .filter((role): role is RoleRecord => Boolean(role));
  }

  private toManagementUser(
    user: UserRecord,
    roles: RoleRecord[],
  ): UserManagementRecord {
    const resolvedRoles = this.resolveRolesFromRecords(user.roleCodes, roles);
    const permissions = Array.from(
      new Set(resolvedRoles.flatMap((role) => role.permissions)),
    );

    return {
      id: user.id,
      employeeCode: user.employeeCode,
      name: user.name,
      roles: resolvedRoles.map((role) => ({
        code: role.code,
        name: role.name,
        permissions: [...role.permissions],
      })),
      permissions,
      defaultPath: this.getDefaultPath(permissions),
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private resolveRolesFromRecords(
    roleCodes: UserRecord['roleCodes'],
    roles: RoleRecord[],
  ) {
    return roleCodes
      .map((roleCode) => roles.find((role) => role.code === roleCode))
      .filter((role): role is RoleRecord => Boolean(role));
  }

  private async findByEmployeeCodeOrThrow(
    employeeCode: string,
  ): Promise<UserRecord> {
    const user = await this.findByEmployeeCode(employeeCode);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Tài khoản không tồn tại.',
      });
    }

    return user;
  }

  private async assertUniqueEmployeeCode(employeeCode: string) {
    if (await this.usersRepository.employeeCodeExists(employeeCode)) {
      throw new ConflictException({
        code: 'DUPLICATE_EMPLOYEE_CODE',
        message: `Mã tài khoản ${employeeCode} đã tồn tại.`,
      });
    }
  }

  private async findRoleOrThrow(roleCode: string): Promise<RoleRecord> {
    const normalizedRoleCode = roleCode.trim().toUpperCase() as RoleCode;
    const roles = await this.usersRepository.listRoles();
    const role = roles.find((item) => item.code === normalizedRoleCode);

    if (!role) {
      throw new BadRequestException({
        code: 'ROLE_NOT_FOUND',
        message: 'Vai trò không hợp lệ.',
      });
    }

    return role;
  }

  private normalizeEmployeeCode(employeeCode: string) {
    return employeeCode.trim().toUpperCase();
  }

  private canChangePassword(user: UserRecord, actor: RequestUser) {
    if (actor.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
      return true;
    }

    return (
      user.id === actor.id &&
      actor.permissions.includes(PERMISSIONS.USERS_CHANGE_OWN_PASSWORD)
    );
  }

  private getDefaultPath(permissions: string[]): string {
    if (permissions.includes(PERMISSIONS.DASHBOARD_VIEW)) {
      return '/dashboard';
    }

    return '/forbidden';
  }

  private async buildStartupUsers(): Promise<UserRecord[]> {
    if (this.shouldSeedDefaultUsers()) {
      return buildSeedUsers();
    }

    const bootstrapPassword = this.configService.get<string>(
      'BOOTSTRAP_ADMIN_PASSWORD',
    );

    if (!bootstrapPassword) {
      return [];
    }

    if (bootstrapPassword.length < 12) {
      throw new Error(
        'BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.',
      );
    }

    const now = new Date().toISOString();

    return [
      {
        id: '00000000-0000-4000-8000-000000000001',
        employeeCode: this.normalizeEmployeeCode(
          this.configService.get<string>('BOOTSTRAP_ADMIN_EMPLOYEE_CODE') ??
            'ADMIN001',
        ),
        name:
          this.configService.get<string>('BOOTSTRAP_ADMIN_NAME') ??
          'Quản trị viên hệ thống',
        passwordHash: await bcrypt.hash(bootstrapPassword, 12),
        roleCodes: [ROLE_CODES.ADMIN],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private shouldSeedDefaultUsers() {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return true;
    }

    return ['true', '1', 'yes', 'on'].includes(
      this.configService
        .get<string>('SEED_DEFAULT_USERS')
        ?.trim()
        .toLowerCase() ?? '',
    );
  }
}
