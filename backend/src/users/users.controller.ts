import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import {
  CreateUserDto,
  ResetUserPasswordDto,
  SetUserStatusDto,
  UpdateUserDto,
} from './dto/user.dto';
import { PERMISSIONS } from './user.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.USERS_VIEW)
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get('roles')
  @Permissions(PERMISSIONS.USERS_VIEW)
  listRoles() {
    return this.usersService.listRoles();
  }

  @Post()
  @Permissions(PERMISSIONS.USERS_MANAGE)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.usersService.createUser(dto);
    await this.auditUserMutation('users.create', actor, result.employeeCode, {
      roleCodes: result.roles.map((role) => role.code),
    });

    return result;
  }

  @Patch(':employeeCode')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  async updateUser(
    @Param('employeeCode') employeeCode: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.usersService.updateUser(employeeCode, dto, actor);
    await this.auditUserMutation('users.update', actor, result.employeeCode, {
      roleCodes: result.roles.map((role) => role.code),
    });

    return result;
  }

  @Patch(':employeeCode/status')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  async setUserStatus(
    @Param('employeeCode') employeeCode: string,
    @Body() dto: SetUserStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.usersService.setUserStatus(
      employeeCode,
      dto,
      actor,
    );
    await this.auditUserMutation('users.status', actor, result.employeeCode, {
      isActive: result.isActive,
    });

    return result;
  }

  @Delete(':employeeCode')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  async deleteUser(
    @Param('employeeCode') employeeCode: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.usersService.deleteUser(employeeCode, actor);
    await this.auditUserMutation('users.delete', actor, result.employeeCode);

    return result;
  }

  @Patch(':employeeCode/password')
  @Permissions(PERMISSIONS.USERS_CHANGE_OWN_PASSWORD)
  async resetPassword(
    @Param('employeeCode') employeeCode: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.usersService.resetPassword(
      employeeCode,
      dto,
      actor,
    );
    await this.auditUserMutation(
      result.id === actor.id
        ? 'users.password.change-own'
        : 'users.password.reset',
      actor,
      result.employeeCode,
    );

    return result;
  }

  private async auditUserMutation(
    action: string,
    actor: RequestUser,
    targetEmployeeCode: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.auditLogService.create({
      action,
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      metadata: {
        targetEmployeeCode,
        ...metadata,
      },
    });
  }
}
