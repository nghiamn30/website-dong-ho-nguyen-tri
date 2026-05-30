import { apiRequest } from "@/lib/auth";

export type RecurrenceType = "ANNUAL_LUNAR" | "ANNUAL_SOLAR";
export type NotificationScope = "BRANCH" | "CLAN" | "CUSTOM";
export type EventType =
  | "DEATH_ANNIVERSARY"
  | "ANCESTOR_ANNIVERSARY"
  | "CLAN_MEETING"
  | "GOOD_NEWS"
  | "SAD_NEWS"
  | "OTHER";
export type EventSourceType = "AUTO_ANNIVERSARY" | "MANUAL";
export type EventStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
export type EventVisibility = "CLAN" | "BRANCH";

export interface DeathAnniversaryRecord {
  id: string;
  personId: string;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  solarDateCache?: string;
  solarDateCacheYear?: number;
  recurrenceType: RecurrenceType;
  branchScopeId?: string;
  notificationScope: NotificationScope;
  notifyBeforeDays: number;
  ceremonyNote?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  clanId: string;
  branchId?: string;
  sourceType: EventSourceType;
  sourceId?: string;
  title: string;
  eventType: EventType;
  description?: string;
  calendarType: "SOLAR" | "LUNAR";
  lunarDay?: number;
  lunarMonth?: number;
  isLeapMonth: boolean;
  startDatetime: string;
  endDatetime?: string;
  location?: string;
  visibilityScope: EventVisibility;
  status: EventStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarMonthDay {
  date: string;
  events: EventRecord[];
}

export interface CalendarMonthResponse {
  year: number;
  month: number;
  days: CalendarMonthDay[];
}

export interface DeathAnniversaryPayload {
  personId: string;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth?: boolean;
  recurrenceType?: RecurrenceType;
  branchScopeId?: string;
  notificationScope?: NotificationScope;
  notifyBeforeDays?: number;
  ceremonyNote?: string;
  active?: boolean;
}

export interface UpdateDeathAnniversaryPayload {
  lunarDay?: number;
  lunarMonth?: number;
  isLeapMonth?: boolean;
  recurrenceType?: RecurrenceType;
  branchScopeId?: string;
  notificationScope?: NotificationScope;
  notifyBeforeDays?: number;
  ceremonyNote?: string;
  active?: boolean;
}

export interface EventPayload {
  title: string;
  eventType: EventType;
  description?: string;
  branchId?: string;
  startDatetime: string;
  endDatetime?: string;
  location?: string;
  visibilityScope?: EventVisibility;
  status?: EventStatus;
}

export interface GenerateEventsResult {
  year: number;
  created: number;
  skipped: number;
  events: EventRecord[];
}

// ----- Lunar conversion -----

export function convertSolarToLunar(solar: string) {
  return apiRequest<{
    lunar: { day: number; month: number; year: number; isLeapMonth: boolean };
  }>(`/calendar/lunar/convert?solar=${encodeURIComponent(solar)}`);
}

export function convertLunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeapMonth = false,
) {
  const params = new URLSearchParams({
    lunarDay: String(lunarDay),
    lunarMonth: String(lunarMonth),
    lunarYear: String(lunarYear),
    isLeapMonth: String(isLeapMonth),
  });
  return apiRequest<{ solar: string }>(`/calendar/lunar/convert?${params.toString()}`);
}

// ----- Calendar views -----

export function getCalendarMonth(year: number, month: number) {
  return apiRequest<CalendarMonthResponse>(
    `/calendar/month?year=${year}&month=${month}`,
  );
}

export function getUpcomingEvents(limit = 10, withinDays = 90) {
  return apiRequest<EventRecord[]>(
    `/calendar/upcoming?limit=${limit}&withinDays=${withinDays}`,
  );
}

// ----- Events -----

export function getEvents(
  filter: { from?: string; to?: string; status?: EventStatus; branchId?: string } = {},
) {
  const params = new URLSearchParams();
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  if (filter.status) params.set("status", filter.status);
  if (filter.branchId) params.set("branchId", filter.branchId);
  const query = params.toString();
  return apiRequest<EventRecord[]>(`/calendar/events${query ? `?${query}` : ""}`);
}

export function getEvent(id: string) {
  return apiRequest<EventRecord>(`/calendar/events/${id}`);
}

export function createEvent(payload: EventPayload) {
  return apiRequest<EventRecord>("/calendar/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEvent(id: string, payload: Partial<EventPayload>) {
  return apiRequest<EventRecord>(`/calendar/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteEvent(id: string) {
  return apiRequest<{ id: string }>(`/calendar/events/${id}`, {
    method: "DELETE",
  });
}

export function generateEvents(year: number) {
  return apiRequest<GenerateEventsResult>("/calendar/events/generate", {
    method: "POST",
    body: JSON.stringify({ year }),
  });
}

// ----- Death anniversaries -----

export function getDeathAnniversaries(personId?: string) {
  const query = personId ? `?personId=${personId}` : "";
  return apiRequest<DeathAnniversaryRecord[]>(
    `/calendar/death-anniversaries${query}`,
  );
}

export function createDeathAnniversary(payload: DeathAnniversaryPayload) {
  return apiRequest<DeathAnniversaryRecord>("/calendar/death-anniversaries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDeathAnniversary(
  id: string,
  payload: UpdateDeathAnniversaryPayload,
) {
  return apiRequest<DeathAnniversaryRecord>(
    `/calendar/death-anniversaries/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteDeathAnniversary(id: string) {
  return apiRequest<{ id: string }>(`/calendar/death-anniversaries/${id}`, {
    method: "DELETE",
  });
}

// ----- Labels -----

export const eventTypeLabels: Record<EventType, string> = {
  DEATH_ANNIVERSARY: "Ngày giỗ",
  ANCESTOR_ANNIVERSARY: "Giỗ tổ",
  CLAN_MEETING: "Họp họ",
  GOOD_NEWS: "Tin vui",
  SAD_NEWS: "Tin buồn",
  OTHER: "Khác",
};

export const eventStatusLabels: Record<EventStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã công bố",
  COMPLETED: "Đã diễn ra",
  CANCELLED: "Đã hủy",
};

export const notificationScopeLabels: Record<NotificationScope, string> = {
  BRANCH: "Theo chi/nhánh",
  CLAN: "Toàn họ",
  CUSTOM: "Tùy chỉnh",
};
