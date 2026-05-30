import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { PERMISSIONS } from '../users/user.types';
import { UpdateNotificationSettingDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_PERMISSIONS } from './notifications.types';
import { ReminderService } from './reminder.service';

@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly reminderService: ReminderService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('notifications')
  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_MANAGE_OWN)
  list(
    @CurrentUser() actor: RequestUser,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listForUser(actor.id, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('notifications/unread-count')
  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_MANAGE_OWN)
  async unreadCount(@CurrentUser() actor: RequestUser) {
    const unreadCount = await this.notificationsService.countUnread(actor.id);
    return { unreadCount };
  }

  @Patch('notifications/:id/read')
  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_MANAGE_OWN)
  markRead(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.notificationsService.markRead(id, actor.id);
  }

  @Post('notifications/read-all')
  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_MANAGE_OWN)
  markAllRead(@CurrentUser() actor: RequestUser) {
    return this.notificationsService.markAllRead(actor.id);
  }

  // ----- Per-user reminder/notification settings -----

  @Get('account/notification-settings')
  @Permissions(NOTIFICATION_PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN)
  getSettings(@CurrentUser() actor: RequestUser) {
    return this.notificationsService.getSettings(actor.id);
  }

  @Patch('account/notification-settings')
  @Permissions(NOTIFICATION_PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN)
  async updateSettings(
    @Body() dto: UpdateNotificationSettingDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.notificationsService.updateSettings(
      actor.id,
      dto,
    );
    await this.auditLogService.create({
      action: 'notifications.settings.update',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      metadata: {
        inAppEnabled: result.inAppEnabled,
        emailEnabled: result.emailEnabled,
      },
    });
    return result;
  }

  // ----- Admin: run reminder job on demand -----

  @Post('notifications/run-reminders')
  @Permissions(PERMISSIONS.AUDIT_LOGS_VIEW)
  async runReminders(@CurrentUser() actor: RequestUser) {
    const result = await this.reminderService.runReminders();
    await this.auditLogService.create({
      action: 'notifications.reminders.run',
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      metadata: { ...result },
    });
    return result;
  }
}
