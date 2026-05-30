import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  DeathAnniversaryRecord,
  EventRecord,
  EventSourceType,
  EventStatus,
  EventType,
  EventVisibility,
  NotificationScope,
  RecurrenceType,
} from './calendar.types';

type PrismaAnniversary = Prisma.DeathAnniversaryGetPayload<object>;
type PrismaEvent = Prisma.EventGetPayload<object>;

export interface SaveAnniversaryInput {
  personId: string;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  recurrenceType: RecurrenceType;
  branchScopeId: string | null;
  notificationScope: NotificationScope;
  notifyBeforeDays: number;
  ceremonyNote: string | null;
  active: boolean;
  solarDateCache: string | null;
  solarDateCacheYear: number | null;
}

export interface UpdateAnniversaryInput {
  lunarDay?: number;
  lunarMonth?: number;
  isLeapMonth?: boolean;
  recurrenceType?: RecurrenceType;
  branchScopeId?: string | null;
  notificationScope?: NotificationScope;
  notifyBeforeDays?: number;
  ceremonyNote?: string | null;
  active?: boolean;
  solarDateCache?: string | null;
  solarDateCacheYear?: number | null;
}

export interface SaveEventInput {
  clanId: string;
  branchId: string | null;
  sourceType: EventSourceType;
  sourceId: string | null;
  title: string;
  eventType: EventType;
  description: string | null;
  calendarType: 'SOLAR' | 'LUNAR';
  lunarDay: number | null;
  lunarMonth: number | null;
  isLeapMonth: boolean;
  startDatetime: string;
  endDatetime: string | null;
  location: string | null;
  visibilityScope: EventVisibility;
  status: EventStatus;
  createdBy: string | null;
}

export interface UpdateEventInput {
  branchId?: string | null;
  title?: string;
  eventType?: EventType;
  description?: string | null;
  startDatetime?: string;
  endDatetime?: string | null;
  location?: string | null;
  visibilityScope?: EventVisibility;
  status?: EventStatus;
}

@Injectable()
export class CalendarRepository {
  private readonly memoryAnniversaries: DeathAnniversaryRecord[] = [];
  private readonly memoryEvents: EventRecord[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  // ----- Death anniversaries -----

  async listAnniversaries(
    filter: {
      personId?: string;
      active?: boolean;
    } = {},
  ): Promise<DeathAnniversaryRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.deathAnniversary.findMany({
        where: { personId: filter.personId, active: filter.active },
        orderBy: [{ lunarMonth: 'asc' }, { lunarDay: 'asc' }],
      });
      return rows.map(toAnniversaryRecord);
    }
    return structuredClone(
      this.memoryAnniversaries
        .filter((row) => !filter.personId || row.personId === filter.personId)
        .filter((row) =>
          filter.active === undefined ? true : row.active === filter.active,
        )
        .sort((a, b) => a.lunarMonth - b.lunarMonth || a.lunarDay - b.lunarDay),
    );
  }

  async findAnniversary(id: string): Promise<DeathAnniversaryRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.deathAnniversary.findUnique({ where: { id } });
      return row ? toAnniversaryRecord(row) : null;
    }
    return structuredClone(
      this.memoryAnniversaries.find((row) => row.id === id) ?? null,
    );
  }

  async createAnniversary(
    input: SaveAnniversaryInput,
  ): Promise<DeathAnniversaryRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.deathAnniversary.create({
        data: {
          personId: input.personId,
          lunarDay: input.lunarDay,
          lunarMonth: input.lunarMonth,
          isLeapMonth: input.isLeapMonth,
          recurrenceType: input.recurrenceType,
          branchScopeId: input.branchScopeId,
          notificationScope: input.notificationScope,
          notifyBeforeDays: input.notifyBeforeDays,
          ceremonyNote: input.ceremonyNote,
          active: input.active,
          solarDateCache: toDate(input.solarDateCache),
          solarDateCacheYear: input.solarDateCacheYear,
        },
      });
      return toAnniversaryRecord(row);
    }
    const now = new Date().toISOString();
    const row: DeathAnniversaryRecord = {
      id: randomUUID(),
      personId: input.personId,
      lunarDay: input.lunarDay,
      lunarMonth: input.lunarMonth,
      isLeapMonth: input.isLeapMonth,
      solarDateCache: input.solarDateCache ?? undefined,
      solarDateCacheYear: input.solarDateCacheYear ?? undefined,
      recurrenceType: input.recurrenceType,
      branchScopeId: input.branchScopeId ?? undefined,
      notificationScope: input.notificationScope,
      notifyBeforeDays: input.notifyBeforeDays,
      ceremonyNote: input.ceremonyNote ?? undefined,
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryAnniversaries.push(row);
    return structuredClone(row);
  }

  async updateAnniversary(
    id: string,
    input: UpdateAnniversaryInput,
  ): Promise<DeathAnniversaryRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.deathAnniversary.update({
        where: { id },
        data: {
          lunarDay: input.lunarDay,
          lunarMonth: input.lunarMonth,
          isLeapMonth: input.isLeapMonth,
          recurrenceType: input.recurrenceType,
          branchScopeId: input.branchScopeId,
          notificationScope: input.notificationScope,
          notifyBeforeDays: input.notifyBeforeDays,
          ceremonyNote: input.ceremonyNote,
          active: input.active,
          solarDateCache:
            input.solarDateCache === undefined
              ? undefined
              : toDate(input.solarDateCache),
          solarDateCacheYear: input.solarDateCacheYear,
        },
      });
      return toAnniversaryRecord(row);
    }
    const row = this.memoryAnniversaries.find((item) => item.id === id);
    if (!row) {
      throw new Error(`DeathAnniversary ${id} not found.`);
    }
    applyOptional(row, 'lunarDay', input.lunarDay);
    applyOptional(row, 'lunarMonth', input.lunarMonth);
    applyOptional(row, 'isLeapMonth', input.isLeapMonth);
    applyOptional(row, 'recurrenceType', input.recurrenceType);
    applyOptional(row, 'branchScopeId', input.branchScopeId);
    applyOptional(row, 'notificationScope', input.notificationScope);
    applyOptional(row, 'notifyBeforeDays', input.notifyBeforeDays);
    applyOptional(row, 'ceremonyNote', input.ceremonyNote);
    applyOptional(row, 'active', input.active);
    applyOptional(row, 'solarDateCache', input.solarDateCache);
    applyOptional(row, 'solarDateCacheYear', input.solarDateCacheYear);
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async deleteAnniversary(id: string): Promise<void> {
    const prisma = this.getPrisma();
    if (prisma) {
      await prisma.deathAnniversary.delete({ where: { id } });
      return;
    }
    const index = this.memoryAnniversaries.findIndex((row) => row.id === id);
    if (index >= 0) {
      this.memoryAnniversaries.splice(index, 1);
    }
  }

  // ----- Events -----

  async listEvents(
    filter: {
      from?: string;
      to?: string;
      status?: EventStatus;
      branchId?: string;
    } = {},
  ): Promise<EventRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.event.findMany({
        where: {
          status: filter.status,
          branchId: filter.branchId,
          startDatetime: {
            gte: filter.from ? new Date(filter.from) : undefined,
            lte: filter.to ? new Date(filter.to) : undefined,
          },
        },
        orderBy: { startDatetime: 'asc' },
      });
      return rows.map(toEventRecord);
    }
    return structuredClone(
      this.memoryEvents
        .filter((row) => (filter.status ? row.status === filter.status : true))
        .filter((row) =>
          filter.branchId ? row.branchId === filter.branchId : true,
        )
        .filter((row) =>
          filter.from ? row.startDatetime >= filter.from : true,
        )
        .filter((row) => (filter.to ? row.startDatetime <= filter.to : true))
        .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime)),
    );
  }

  async findEvent(id: string): Promise<EventRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.event.findUnique({ where: { id } });
      return row ? toEventRecord(row) : null;
    }
    return structuredClone(
      this.memoryEvents.find((row) => row.id === id) ?? null,
    );
  }

  async findEventBySource(
    sourceType: EventSourceType,
    sourceId: string,
    startDatetime: string,
  ): Promise<EventRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.event.findFirst({
        where: { sourceType, sourceId, startDatetime: new Date(startDatetime) },
      });
      return row ? toEventRecord(row) : null;
    }
    return structuredClone(
      this.memoryEvents.find(
        (row) =>
          row.sourceType === sourceType &&
          row.sourceId === sourceId &&
          row.startDatetime === startDatetime,
      ) ?? null,
    );
  }

  async createEvent(input: SaveEventInput): Promise<EventRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.event.create({
        data: {
          clanId: input.clanId,
          branchId: input.branchId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          title: input.title,
          eventType: input.eventType,
          description: input.description,
          calendarType: input.calendarType,
          lunarDay: input.lunarDay,
          lunarMonth: input.lunarMonth,
          isLeapMonth: input.isLeapMonth,
          startDatetime: new Date(input.startDatetime),
          endDatetime: input.endDatetime ? new Date(input.endDatetime) : null,
          location: input.location,
          visibilityScope: input.visibilityScope,
          status: input.status,
          createdBy: input.createdBy,
        },
      });
      return toEventRecord(row);
    }
    const now = new Date().toISOString();
    const row: EventRecord = {
      id: randomUUID(),
      clanId: input.clanId,
      branchId: input.branchId ?? undefined,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? undefined,
      title: input.title,
      eventType: input.eventType,
      description: input.description ?? undefined,
      calendarType: input.calendarType,
      lunarDay: input.lunarDay ?? undefined,
      lunarMonth: input.lunarMonth ?? undefined,
      isLeapMonth: input.isLeapMonth,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime ?? undefined,
      location: input.location ?? undefined,
      visibilityScope: input.visibilityScope,
      status: input.status,
      createdBy: input.createdBy ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryEvents.push(row);
    return structuredClone(row);
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<EventRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.event.update({
        where: { id },
        data: {
          branchId: input.branchId,
          title: input.title,
          eventType: input.eventType,
          description: input.description,
          startDatetime: input.startDatetime
            ? new Date(input.startDatetime)
            : undefined,
          endDatetime:
            input.endDatetime === undefined
              ? undefined
              : input.endDatetime
                ? new Date(input.endDatetime)
                : null,
          location: input.location,
          visibilityScope: input.visibilityScope,
          status: input.status,
        },
      });
      return toEventRecord(row);
    }
    const row = this.memoryEvents.find((item) => item.id === id);
    if (!row) {
      throw new Error(`Event ${id} not found.`);
    }
    applyOptional(row, 'branchId', input.branchId);
    applyOptional(row, 'title', input.title);
    applyOptional(row, 'eventType', input.eventType);
    applyOptional(row, 'description', input.description);
    applyOptional(row, 'startDatetime', input.startDatetime);
    applyOptional(row, 'endDatetime', input.endDatetime);
    applyOptional(row, 'location', input.location);
    applyOptional(row, 'visibilityScope', input.visibilityScope);
    applyOptional(row, 'status', input.status);
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async deleteEvent(id: string): Promise<void> {
    const prisma = this.getPrisma();
    if (prisma) {
      await prisma.event.delete({ where: { id } });
      return;
    }
    const index = this.memoryEvents.findIndex((row) => row.id === id);
    if (index >= 0) {
      this.memoryEvents.splice(index, 1);
    }
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function applyOptional<T, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | null | undefined,
) {
  if (value === undefined) {
    return;
  }
  target[key] = (value === null ? undefined : value) as T[K];
}

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function fromDate(value: Date | null): string | undefined {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function toAnniversaryRecord(row: PrismaAnniversary): DeathAnniversaryRecord {
  return {
    id: row.id,
    personId: row.personId,
    lunarDay: row.lunarDay,
    lunarMonth: row.lunarMonth,
    isLeapMonth: row.isLeapMonth,
    solarDateCache: fromDate(row.solarDateCache),
    solarDateCacheYear: row.solarDateCacheYear ?? undefined,
    recurrenceType: row.recurrenceType,
    branchScopeId: row.branchScopeId ?? undefined,
    notificationScope: row.notificationScope,
    notifyBeforeDays: row.notifyBeforeDays,
    ceremonyNote: row.ceremonyNote ?? undefined,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toEventRecord(row: PrismaEvent): EventRecord {
  return {
    id: row.id,
    clanId: row.clanId,
    branchId: row.branchId ?? undefined,
    sourceType: row.sourceType,
    sourceId: row.sourceId ?? undefined,
    title: row.title,
    eventType: row.eventType,
    description: row.description ?? undefined,
    calendarType: row.calendarType,
    lunarDay: row.lunarDay ?? undefined,
    lunarMonth: row.lunarMonth ?? undefined,
    isLeapMonth: row.isLeapMonth,
    startDatetime: row.startDatetime.toISOString(),
    endDatetime: row.endDatetime ? row.endDatetime.toISOString() : undefined,
    location: row.location ?? undefined,
    visibilityScope: row.visibilityScope,
    status: row.status,
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
