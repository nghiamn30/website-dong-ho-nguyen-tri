import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { PERMISSIONS } from '../users/user.types';
import { BranchScopeService } from './branch-scope.service';
import { AssignBranchScopeDto } from './dto/branch-scope.dto';

@Controller('admin/branch-scopes')
export class BranchScopeController {
  constructor(
    private readonly branchScopeService: BranchScopeService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.ROLES_MANAGE_BRANCH_SCOPE)
  list(@Query('userId') userId?: string) {
    return userId
      ? this.branchScopeService.listByUser(userId)
      : this.branchScopeService.listAll();
  }

  @Post()
  @Permissions(PERMISSIONS.ROLES_MANAGE_BRANCH_SCOPE)
  async assign(
    @Body() dto: AssignBranchScopeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.branchScopeService.assignScope({
      userId: dto.userId,
      roleCode: dto.roleCode,
      branchId: dto.branchId,
    });
    await this.auditLogService.create({
      action: 'admin.branch-scope.assign',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      entityType: 'branch_scoped_role',
      entityId: result.id,
      afterData: { ...result },
      metadata: {
        targetUserId: dto.userId,
        roleCode: dto.roleCode,
        branchId: dto.branchId,
      },
    });
    return result;
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.ROLES_MANAGE_BRANCH_SCOPE)
  async remove(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    const result = await this.branchScopeService.removeScope(id);
    await this.auditLogService.create({
      action: 'admin.branch-scope.remove',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      entityType: 'branch_scoped_role',
      entityId: id,
    });
    return result;
  }
}
