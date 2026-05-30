export const NOTIFICATION_PERMISSIONS = {
  NOTIFICATIONS_MANAGE_OWN: 'notifications.manage-own',
  REMINDER_SETTINGS_MANAGE_OWN: 'reminder-settings.manage-own',
} as const;

export const NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL'] as const;
export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface NotificationRecord {
  id: string;
  userId: string;
  eventId?: string;
  channel: NotificationChannel;
  reminderKey: string;
  title: string;
  content?: string;
  readAt?: string;
  sentAt?: string;
  status: NotificationStatus;
  errorMessage?: string;
  createdAt: string;
}

export interface NotificationSettingRecord {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  email?: string;
  createdAt: string;
  updatedAt: string;
}
