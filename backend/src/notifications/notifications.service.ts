import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import {
  NotificationRecord,
  NotificationSettingRecord,
} from './notifications.types';
import { UpdateNotificationSettingDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async listForUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<{ items: NotificationRecord[]; unreadCount: number }> {
    const [items, unreadCount] = await Promise.all([
      this.repository.listForUser(userId, options),
      this.repository.countUnread(userId),
    ]);
    return { items, unreadCount };
  }

  countUnread(userId: string) {
    return this.repository.countUnread(userId);
  }

  async markRead(id: string, userId: string): Promise<NotificationRecord> {
    const updated = await this.repository.markRead(id, userId);
    if (!updated) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Không tìm thấy thông báo.',
      });
    }
    return updated;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const updated = await this.repository.markAllRead(userId);
    return { updated };
  }

  async getSettings(userId: string): Promise<NotificationSettingRecord> {
    const existing = await this.repository.getSetting(userId);
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    return {
      userId,
      inAppEnabled: true,
      emailEnabled: false,
      email: undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateSettings(
    userId: string,
    dto: UpdateNotificationSettingDto,
  ): Promise<NotificationSettingRecord> {
    const current = await this.getSettings(userId);
    return this.repository.upsertSetting({
      userId,
      inAppEnabled: dto.inAppEnabled ?? current.inAppEnabled,
      emailEnabled: dto.emailEnabled ?? current.emailEnabled,
      email:
        dto.email !== undefined
          ? dto.email.trim() === ''
            ? null
            : dto.email.trim()
          : (current.email ?? null),
    });
  }
}
