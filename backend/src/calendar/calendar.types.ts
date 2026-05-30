export const CALENDAR_PERMISSIONS = {
  DEATH_ANNIVERSARIES_MANAGE: 'death-anniversaries.manage',
  EVENTS_MANAGE: 'events.manage',
  EVENTS_PUBLISH: 'events.publish',
} as const;

export const RECURRENCE_TYPES = ['ANNUAL_LUNAR', 'ANNUAL_SOLAR'] as const;
export const NOTIFICATION_SCOPES = ['BRANCH', 'CLAN', 'CUSTOM'] as const;
export const EVENT_TYPES = [
  'DEATH_ANNIVERSARY',
  'ANCESTOR_ANNIVERSARY',
  'CLAN_MEETING',
  'GOOD_NEWS',
  'SAD_NEWS',
  'OTHER',
] as const;
export const EVENT_SOURCE_TYPES = ['AUTO_ANNIVERSARY', 'MANUAL'] as const;
export const EVENT_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'COMPLETED',
  'CANCELLED',
] as const;
export const EVENT_VISIBILITIES = ['CLAN', 'BRANCH'] as const;

export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];
export type NotificationScope = (typeof NOTIFICATION_SCOPES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventSourceType = (typeof EVENT_SOURCE_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

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
  calendarType: 'SOLAR' | 'LUNAR';
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
