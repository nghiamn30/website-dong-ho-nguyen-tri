import { apiRequest } from "@/lib/auth";

export type NotificationChannel = "IN_APP" | "EMAIL";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

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

export interface NotificationListResponse {
  items: NotificationRecord[];
  unreadCount: number;
}

export interface NotificationSettingRecord {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettingPayload {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  email?: string;
}

export interface ReminderRunResult {
  scannedEvents: number;
  created: number;
  skipped: number;
  emailFailed: number;
}

export function getNotifications(unreadOnly = false, limit?: number) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unreadOnly", "true");
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  return apiRequest<NotificationListResponse>(
    `/notifications${query ? `?${query}` : ""}`,
  );
}

export function getUnreadCount() {
  return apiRequest<{ unreadCount: number }>("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return apiRequest<NotificationRecord>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>("/notifications/read-all", {
    method: "POST",
  });
}

export function getNotificationSettings() {
  return apiRequest<NotificationSettingRecord>(
    "/account/notification-settings",
  );
}

export function updateNotificationSettings(payload: NotificationSettingPayload) {
  return apiRequest<NotificationSettingRecord>(
    "/account/notification-settings",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function runReminders() {
  return apiRequest<ReminderRunResult>("/notifications/run-reminders", {
    method: "POST",
  });
}
