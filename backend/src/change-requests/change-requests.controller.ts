import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { ChangeRequestsService } from './change-requests.service';
import {
  CHANGE_REQUEST_PERMISSIONS,
  ChangeRequestEntityType,
  ChangeRequestFilter,
  ChangeRequestStatus,
  ChangeRequestType,
} from './change-requests.types';
import {
  CreateChangeRequestDto,
  ReviewChangeRequestDto,
} from './dto/change-request.dto';

@Controller('change-requests')
export class ChangeRequestsController {
  constructor(
    private readonly changeRequestsService: ChangeRequestsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @Permissions(CHANGE_REQUEST_PERMISSIONS.CREATE)
  async create(
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.changeRequestsService.create({
      requestedBy: actor.id,
      entityType: dto.entityType as ChangeRequestEntityType,
      entityId: dto.entityId,
      requestType: dto.requestType as ChangeRequestType,
      proposedData: dto.proposedData,
      reason: dto.reason,
    });
    await this.auditLogService.create({
      action: 'change-requests.create',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      entityType: 'change_request',
      entityId: result.id,
      afterData: { ...result },
      reason: dto.reason,
    });
    return result;
  }

  @Get()
  @Permissions(CHANGE_REQUEST_PERMISSIONS.CREATE)
  list(
    @CurrentUser() actor: RequestUser,
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('mine') mine?: string,
  ) {
    const filter: ChangeRequestFilter = {
      status: normalizeStatus(status),
      entityType: entityType?.trim() || undefined,
    };

    // Người không có quyền duyệt chỉ thấy đề xuất của chính mình.
    if (!this.canReview(actor) || mine === 'true') {
      filter.requestedBy = actor.id;
    }

    return this.changeRequestsService.list(filter);
  }

  @Get(':id')
  @Permissions(CHANGE_REQUEST_PERMISSIONS.CREATE)
  async getOne(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    const request = await this.changeRequestsService.getById(id);
    if (!this.canReview(actor) && request.requestedBy !== actor.id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bạn chỉ xem được đề xuất của chính mình.',
      });
    }
    return request;
  }

  @Post(':id/approve')
  @Permissions(CHANGE_REQUEST_PERMISSIONS.REVIEW)
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewChangeRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const { request, applied } = await this.changeRequestsService.approve(
      id,
      actor.id,
      dto.reviewNote,
    );
    await this.auditLogService.create({
      action: 'change-requests.approve',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      entityType: request.entityType,
      entityId: request.entityId ?? request.id,
      beforeData: applied.before,
      afterData: applied.after,
      reason: dto.reviewNote,
      metadata: {
        changeRequestId: request.id,
        requestType: request.requestType,
      },
    });
    return request;
  }

  @Post(':id/reject')
  @Permissions(CHANGE_REQUEST_PERMISSIONS.REVIEW)
  async reject(
    @Param('id') id: string,
    @Body() dto: ReviewChangeRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const request = await this.changeRequestsService.reject(
      id,
      actor.id,
      dto.reviewNote,
    );
    await this.auditLogService.create({
      action: 'change-requests.reject',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      entityType: 'change_request',
      entityId: request.id,
      reason: dto.reviewNote,
      metadata: { changeRequestId: request.id },
    });
    return request;
  }

  private canReview(actor: RequestUser): boolean {
    return actor.permissions.includes(CHANGE_REQUEST_PERMISSIONS.REVIEW);
  }
}

function normalizeStatus(value?: string): ChangeRequestStatus | undefined {
  if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') {
    return value;
  }
  return undefined;
}
