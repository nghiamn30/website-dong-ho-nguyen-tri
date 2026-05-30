import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  NotificationChannel,
  NotificationRecord,
  NotificationSettingRecord,
  NotificationStatus,
} from './notifications.types';

type PrismaNotification = Prisma.NotificationGetPayload<object>;
type PrismaSetting = Prisma.NotificationSettingGetPayload<object>;

export interface CreateNotificationInput {
  userId: string;
  eventId: string | null;
  channel: NotificationChannel;
  reminderKey: string;
  title: string;
  content: string | null;
  status: NotificationStatus;
  sentAt: string | null;
  errorMessage: string | null;
}

export interface UpsertSettingInput {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  email: string | null;
}

@Injectable()
export class NotificationsRepository {
  private readonly memoryNotifications: NotificationRecord[] = [];
  private readonly memorySettings = new Map<
    string,
    NotificationSettingRecord
  >();

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  async listForUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<NotificationRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.notification.findMany({
        where: {
          userId,
          readAt: options.unreadOnly ? null : undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit,
      });
      return rows.map(toNotificationRecord);
    }
    return structuredClone(
      this.memoryNotifications
        .filter((row) => row.userId === userId)
        .filter((row) => (options.unreadOnly ? !row.readAt : true))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, options.limit),
    );
  }

  async countUnread(userId: string): Promise<number> {
    const prisma = this.getPrisma();
    if (prisma) {
      return prisma.notification.count({ where: { userId, readAt: null } });
    }
    return this.memoryNotifications.filter(
      (row) => row.userId === userId && !row.readAt,
    ).length;
  }

  async existsByReminderKey(reminderKey: string): Promise<boolean> {
    const prisma = this.getPrisma();
    if (prisma) {
      const count = await prisma.notification.count({ where: { reminderKey } });
      return count > 0;
    }
    return this.memoryNotifications.some(
      (row) => row.reminderKey === reminderKey,
    );
  }

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.notification.create({
        data: {
          userId: input.userId,
          eventId: input.eventId,
          channel: input.channel,
          reminderKey: input.reminderKey,
          title: input.title,
          content: input.content,
          status: input.status,
          sentAt: input.sentAt ? new Date(input.sentAt) : null,
          errorMessage: input.errorMessage,
        },
      });
      return toNotificationRecord(row);
    }
    const now = new Date().toISOString();
    const row: NotificationRecord = {
      id: randomUUID(),
      userId: input.userId,
      eventId: input.eventId ?? undefined,
      channel: input.channel,
      reminderKey: input.reminderKey,
      title: input.title,
      content: input.content ?? undefined,
      readAt: undefined,
      sentAt: input.sentAt ?? undefined,
      status: input.status,
      errorMessage: input.errorMessage ?? undefined,
      createdAt: now,
    };
    this.memoryNotifications.push(row);
    return structuredClone(row);
  }

  async findForUser(
    id: string,
    userId: string,
  ): Promise<NotificationRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.notification.findFirst({
        where: { id, userId },
      });
      return row ? toNotificationRecord(row) : null;
    }
    return structuredClone(
      this.memoryNotifications.find(
        (row) => row.id === id && row.userId === userId,
      ) ?? null,
    );
  }

  async markRead(
    id: string,
    userId: string,
  ): Promise<NotificationRecord | null> {
    const prisma = this.getPrisma();
    const readAt = new Date();
    if (prisma) {
      const result = await prisma.notification.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt },
      });
      if (result.count === 0) {
        const existing = await prisma.notification.findFirst({
          where: { id, userId },
        });
        return existing ? toNotificationRecord(existing) : null;
      }
      const row = await prisma.notification.findFirst({
        where: { id, userId },
      });
      return row ? toNotificationRecord(row) : null;
    }
    const row = this.memoryNotifications.find(
      (item) => item.id === id && item.userId === userId,
    );
    if (!row) return null;
    if (!row.readAt) {
      row.readAt = readAt.toISOString();
    }
    return structuredClone(row);
  }

  async markAllRead(userId: string): Promise<number> {
    const prisma = this.getPrisma();
    const readAt = new Date();
    if (prisma) {
      const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt },
      });
      return result.count;
    }
    let count = 0;
    for (const row of this.memoryNotifications) {
      if (row.userId === userId && !row.readAt) {
        row.readAt = readAt.toISOString();
        count += 1;
      }
    }
    return count;
  }

  // ----- Settings -----

  async getSetting(userId: string): Promise<NotificationSettingRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.notificationSetting.findUnique({
        where: { userId },
      });
      return row ? toSettingRecord(row) : null;
    }
    return structuredClone(this.memorySettings.get(userId) ?? null);
  }

  async upsertSetting(
    input: UpsertSettingInput,
  ): Promise<NotificationSettingRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.notificationSetting.upsert({
        where: { userId: input.userId },
        update: {
          inAppEnabled: input.inAppEnabled,
          emailEnabled: input.emailEnabled,
          email: input.email,
        },
        create: {
          userId: input.userId,
          inAppEnabled: input.inAppEnabled,
          emailEnabled: input.emailEnabled,
          email: input.email,
        },
      });
      return toSettingRecord(row);
    }
    const now = new Date().toISOString();
    const existing = this.memorySettings.get(input.userId);
    const row: NotificationSettingRecord = {
      userId: input.userId,
      inAppEnabled: input.inAppEnabled,
      emailEnabled: input.emailEnabled,
      email: input.email ?? undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.memorySettings.set(input.userId, row);
    return structuredClone(row);
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function toNotificationRecord(row: PrismaNotification): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    eventId: row.eventId ?? undefined,
    channel: row.channel,
    reminderKey: row.reminderKey,
    title: row.title,
    content: row.content ?? undefined,
    readAt: row.readAt ? row.readAt.toISOString() : undefined,
    sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
    status: row.status,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toSettingRecord(row: PrismaSetting): NotificationSettingRecord {
  return {
    userId: row.userId,
    inAppEnabled: row.inAppEnabled,
    emailEnabled: row.emailEnabled,
    email: row.email ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
