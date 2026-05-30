import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { PERMISSIONS } from '../users/user.types';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { BranchRecord, PersonRecord } from '../genealogy/genealogy.types';
import { CalendarRepository } from './calendar.repository';
import {
  CalendarMonthResponse,
  DeathAnniversaryRecord,
  EventRecord,
  EventStatus,
  EventVisibility,
  NotificationScope,
} from './calendar.types';
import {
  CreateDeathAnniversaryDto,
  CreateEventDto,
  UpdateDeathAnniversaryDto,
  UpdateEventDto,
} from './dto/calendar.dto';
import { LunarCalendarService } from './lunar/lunar-calendar.service';

const VIETNAM_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly genealogy: GenealogyRepository,
    private readonly lunar: LunarCalendarService,
  ) {}

  // ----- Death anniversaries -----

  listAnniversaries(personId?: string) {
    return this.repository.listAnniversaries({ personId });
  }

  async getAnniversary(id: string): Promise<DeathAnniversaryRecord> {
    const record = await this.repository.findAnniversary(id);
    if (!record) {
      throw new NotFoundException({
        code: 'ANNIVERSARY_NOT_FOUND',
        message: 'Không tìm thấy ngày giỗ.',
      });
    }
    return record;
  }

  async createAnniversary(
    dto: CreateDeathAnniversaryDto,
    actor: RequestUser,
  ): Promise<DeathAnniversaryRecord> {
    const person = await this.findPersonOrThrow(dto.personId);
    if (person.lifeStatus !== 'DECEASED') {
      throw new BadRequestException({
        code: 'PERSON_NOT_DECEASED',
        message: 'Chỉ tạo ngày giỗ cho người đã khuất.',
      });
    }

    const scope = await this.resolveAnniversaryScope(person, {
      notificationScope: dto.notificationScope,
      branchScopeId: dto.branchScopeId,
    });

    await this.assertCanManageBranchScope(
      actor,
      scope.branchScopeId,
      scope.notificationScope,
    );

    const solar = this.computeSolarCache(
      dto.lunarDay,
      dto.lunarMonth,
      dto.isLeapMonth ?? false,
    );

    return this.repository.createAnniversary({
      personId: dto.personId,
      lunarDay: dto.lunarDay,
      lunarMonth: dto.lunarMonth,
      isLeapMonth: dto.isLeapMonth ?? false,
      recurrenceType: dto.recurrenceType ?? 'ANNUAL_LUNAR',
      branchScopeId: scope.branchScopeId,
      notificationScope: scope.notificationScope,
      notifyBeforeDays: dto.notifyBeforeDays ?? 7,
      ceremonyNote: normalizeText(dto.ceremonyNote),
      active: dto.active ?? true,
      solarDateCache: solar.date,
      solarDateCacheYear: solar.year,
    });
  }

  async updateAnniversary(
    id: string,
    dto: UpdateDeathAnniversaryDto,
    actor: RequestUser,
  ): Promise<DeathAnniversaryRecord> {
    const existing = await this.getAnniversary(id);

    const nextScopeType = dto.notificationScope ?? existing.notificationScope;
    const nextBranchScope =
      dto.branchScopeId !== undefined
        ? (dto.branchScopeId ?? null)
        : (existing.branchScopeId ?? null);

    // Authorize against both the previous and the next scope.
    await this.assertCanManageBranchScope(
      actor,
      existing.branchScopeId ?? null,
      existing.notificationScope,
    );
    await this.assertCanManageBranchScope(
      actor,
      nextBranchScope,
      nextScopeType,
    );

    if (nextScopeType === 'CUSTOM' && !nextBranchScope) {
      throw new BadRequestException({
        code: 'BRANCH_SCOPE_REQUIRED',
        message: 'Phạm vi tùy chỉnh cần chọn chi/nhánh nhận nhắc.',
      });
    }
    if (nextBranchScope) {
      await this.findBranchOrThrow(nextBranchScope);
    }

    const lunarDay = dto.lunarDay ?? existing.lunarDay;
    const lunarMonth = dto.lunarMonth ?? existing.lunarMonth;
    const isLeapMonth = dto.isLeapMonth ?? existing.isLeapMonth;
    const solar = this.computeSolarCache(lunarDay, lunarMonth, isLeapMonth);

    return this.repository.updateAnniversary(id, {
      lunarDay,
      lunarMonth,
      isLeapMonth,
      recurrenceType: dto.recurrenceType,
      branchScopeId: nextScopeType === 'CLAN' ? null : nextBranchScope,
      notificationScope: nextScopeType,
      notifyBeforeDays: dto.notifyBeforeDays,
      ceremonyNote:
        dto.ceremonyNote !== undefined
          ? normalizeText(dto.ceremonyNote)
          : undefined,
      active: dto.active,
      solarDateCache: solar.date,
      solarDateCacheYear: solar.year,
    });
  }

  async deleteAnniversary(id: string, actor: RequestUser) {
    const existing = await this.getAnniversary(id);
    await this.assertCanManageBranchScope(
      actor,
      existing.branchScopeId ?? null,
      existing.notificationScope,
    );
    await this.repository.deleteAnniversary(id);
    return { id };
  }

  // ----- Events -----

  async listEvents(filter: {
    from?: string;
    to?: string;
    status?: EventStatus;
    branchId?: string;
  }) {
    return this.repository.listEvents(filter);
  }

  async getEvent(id: string): Promise<EventRecord> {
    const event = await this.repository.findEvent(id);
    if (!event) {
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'Không tìm thấy sự kiện.',
      });
    }
    return event;
  }

  async createEvent(
    dto: CreateEventDto,
    actor: RequestUser,
  ): Promise<EventRecord> {
    const clan = await this.findClanOrThrow();
    const visibility: EventVisibility = dto.visibilityScope ?? 'CLAN';
    const branchId = dto.branchId ?? null;

    if (visibility === 'BRANCH' && !branchId) {
      throw new BadRequestException({
        code: 'EVENT_BRANCH_REQUIRED',
        message: 'Sự kiện theo chi/nhánh cần chọn chi/nhánh.',
      });
    }
    if (branchId) {
      await this.findBranchOrThrow(branchId);
    }

    await this.assertCanManageEventScope(actor, visibility, branchId);

    const requestedStatus: EventStatus = dto.status ?? 'PUBLISHED';
    const status = this.resolveEventStatus(actor, requestedStatus);

    this.assertDateRange(dto.startDatetime, dto.endDatetime);

    return this.repository.createEvent({
      clanId: clan.id,
      branchId,
      sourceType: 'MANUAL',
      sourceId: null,
      title: dto.title.trim(),
      eventType: dto.eventType,
      description: normalizeText(dto.description),
      calendarType: 'SOLAR',
      lunarDay: null,
      lunarMonth: null,
      isLeapMonth: false,
      startDatetime: dto.startDatetime,
      endDatetime: dto.endDatetime ?? null,
      location: normalizeText(dto.location),
      visibilityScope: visibility,
      status,
      createdBy: actor.id,
    });
  }

  async updateEvent(
    id: string,
    dto: UpdateEventDto,
    actor: RequestUser,
  ): Promise<EventRecord> {
    const existing = await this.getEvent(id);

    const visibility = dto.visibilityScope ?? existing.visibilityScope;
    const branchId =
      dto.branchId !== undefined
        ? (dto.branchId ?? null)
        : (existing.branchId ?? null);

    if (visibility === 'BRANCH' && !branchId) {
      throw new BadRequestException({
        code: 'EVENT_BRANCH_REQUIRED',
        message: 'Sự kiện theo chi/nhánh cần chọn chi/nhánh.',
      });
    }
    if (branchId) {
      await this.findBranchOrThrow(branchId);
    }

    // Authorize against both old and new scope.
    await this.assertCanManageEventScope(
      actor,
      existing.visibilityScope,
      existing.branchId ?? null,
    );
    await this.assertCanManageEventScope(actor, visibility, branchId);

    let status = existing.status;
    if (dto.status !== undefined && dto.status !== existing.status) {
      status = this.resolveEventStatus(actor, dto.status);
    }

    const startDatetime = dto.startDatetime ?? existing.startDatetime;
    const endDatetime =
      dto.endDatetime !== undefined
        ? (dto.endDatetime ?? null)
        : (existing.endDatetime ?? null);
    this.assertDateRange(startDatetime, endDatetime);

    return this.repository.updateEvent(id, {
      branchId,
      title: dto.title?.trim(),
      eventType: dto.eventType,
      description:
        dto.description !== undefined
          ? normalizeText(dto.description)
          : undefined,
      startDatetime: dto.startDatetime,
      endDatetime:
        dto.endDatetime === undefined ? undefined : (dto.endDatetime ?? null),
      location:
        dto.location !== undefined ? normalizeText(dto.location) : undefined,
      visibilityScope: visibility,
      status,
    });
  }

  async deleteEvent(id: string, actor: RequestUser) {
    const existing = await this.getEvent(id);
    await this.assertCanManageEventScope(
      actor,
      existing.visibilityScope,
      existing.branchId ?? null,
    );
    await this.repository.deleteEvent(id);
    return { id };
  }

  // ----- Calendar views -----

  async getMonth(year: number, month: number): Promise<CalendarMonthResponse> {
    const from = `${year}-${pad(month)}-01T00:00:00+07:00`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const to = `${year}-${pad(month)}-${pad(lastDay)}T23:59:59+07:00`;
    const events = await this.repository.listEvents({ from, to });
    const visible = events.filter(
      (event) => event.status !== 'CANCELLED' && event.status !== 'DRAFT',
    );

    const byDay = new Map<string, EventRecord[]>();
    for (const event of visible) {
      const day = this.toVietnamDate(event.startDatetime);
      const list = byDay.get(day) ?? [];
      list.push(event);
      byDay.set(day, list);
    }

    const days = Array.from({ length: lastDay }, (_, index) => {
      const date = `${year}-${pad(month)}-${pad(index + 1)}`;
      return { date, events: byDay.get(date) ?? [] };
    });

    return { year, month, days };
  }

  async getUpcoming(limit = 10, withinDays = 90): Promise<EventRecord[]> {
    const now = new Date();
    const to = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    const events = await this.repository.listEvents({
      from: now.toISOString(),
      to: to.toISOString(),
    });
    return events
      .filter(
        (event) => event.status === 'PUBLISHED' || event.status === 'COMPLETED',
      )
      .slice(0, limit);
  }

  /**
   * Generate (or refresh) auto events for every active anniversary in a solar
   * year. Existing auto events for the same source/date are left untouched so
   * the operation is idempotent.
   */
  async generateEventsForYear(year: number, actor: RequestUser) {
    const clan = await this.findClanOrThrow();
    const anniversaries = await this.repository.listAnniversaries({
      active: true,
    });
    const created: EventRecord[] = [];
    let skipped = 0;

    for (const anniversary of anniversaries) {
      const person = await this.genealogy.findPerson(anniversary.personId);
      if (!person) {
        continue;
      }
      const solarIso = this.lunar.resolveAnniversaryIso(
        anniversary.lunarDay,
        anniversary.lunarMonth,
        anniversary.isLeapMonth,
        year,
      );
      const startDatetime = `${solarIso}T00:00:00+07:00`;
      const normalizedStart = new Date(startDatetime).toISOString();

      const existing = await this.repository.findEventBySource(
        'AUTO_ANNIVERSARY',
        anniversary.id,
        normalizedStart,
      );
      if (existing) {
        skipped += 1;
        continue;
      }

      const { visibility, branchId } =
        this.eventScopeFromAnniversary(anniversary);
      const isFounder = clan.founderPersonId === person.id;

      const event = await this.repository.createEvent({
        clanId: clan.id,
        branchId,
        sourceType: 'AUTO_ANNIVERSARY',
        sourceId: anniversary.id,
        title: `Giỗ ${person.fullName}`,
        eventType: isFounder ? 'ANCESTOR_ANNIVERSARY' : 'DEATH_ANNIVERSARY',
        description: anniversary.ceremonyNote ?? null,
        calendarType: 'LUNAR',
        lunarDay: anniversary.lunarDay,
        lunarMonth: anniversary.lunarMonth,
        isLeapMonth: anniversary.isLeapMonth,
        startDatetime: normalizedStart,
        endDatetime: null,
        location: null,
        visibilityScope: visibility,
        status: 'PUBLISHED',
        createdBy: actor.id,
      });
      created.push(event);
    }

    return { year, created: created.length, skipped, events: created };
  }

  // ----- Scope helpers -----

  private eventScopeFromAnniversary(anniversary: DeathAnniversaryRecord): {
    visibility: EventVisibility;
    branchId: string | null;
  } {
    if (
      anniversary.notificationScope === 'CLAN' ||
      !anniversary.branchScopeId
    ) {
      return { visibility: 'CLAN', branchId: null };
    }
    return { visibility: 'BRANCH', branchId: anniversary.branchScopeId };
  }

  private async resolveAnniversaryScope(
    person: PersonRecord,
    override: {
      notificationScope?: NotificationScope;
      branchScopeId?: string;
    },
  ): Promise<{
    notificationScope: NotificationScope;
    branchScopeId: string | null;
  }> {
    if (override.notificationScope === 'CLAN') {
      return { notificationScope: 'CLAN', branchScopeId: null };
    }
    if (override.notificationScope === 'CUSTOM') {
      if (!override.branchScopeId) {
        throw new BadRequestException({
          code: 'BRANCH_SCOPE_REQUIRED',
          message: 'Phạm vi tùy chỉnh cần chọn chi/nhánh nhận nhắc.',
        });
      }
      await this.findBranchOrThrow(override.branchScopeId);
      return {
        notificationScope: 'CUSTOM',
        branchScopeId: override.branchScopeId,
      };
    }

    // Default: branch of the person, preferring a branch the person heads.
    const branches = await this.genealogy.listBranches();
    const headed = branches.find((branch) => branch.headPersonId === person.id);
    const branchId = headed?.id ?? person.branchId ?? null;
    if (override.branchScopeId) {
      await this.findBranchOrThrow(override.branchScopeId);
      return {
        notificationScope: 'BRANCH',
        branchScopeId: override.branchScopeId,
      };
    }
    if (!branchId) {
      return { notificationScope: 'CLAN', branchScopeId: null };
    }
    return { notificationScope: 'BRANCH', branchScopeId: branchId };
  }

  /** All branch ids in the subtree rooted at the given branch (inclusive). */
  async branchSubtreeIds(branchId: string): Promise<Set<string>> {
    const branches = await this.genealogy.listBranches();
    return this.collectBranchSubtree(branches, [branchId]);
  }

  /** Branch ids a non-clan manager (e.g. trưởng chi) is allowed to manage. */
  async resolveManagedBranchIds(actor: RequestUser): Promise<Set<string>> {
    if (!actor.personId) {
      return new Set();
    }
    const branches = await this.genealogy.listBranches();
    const headed = branches
      .filter((branch) => branch.headPersonId === actor.personId)
      .map((branch) => branch.id);
    return this.collectBranchSubtree(branches, headed);
  }

  private collectBranchSubtree(
    branches: BranchRecord[],
    rootIds: string[],
  ): Set<string> {
    const childrenByParent = new Map<string, string[]>();
    for (const branch of branches) {
      if (branch.parentBranchId) {
        const list = childrenByParent.get(branch.parentBranchId) ?? [];
        list.push(branch.id);
        childrenByParent.set(branch.parentBranchId, list);
      }
    }
    const result = new Set<string>();
    const stack = [...rootIds];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (result.has(current)) continue;
      result.add(current);
      for (const child of childrenByParent.get(current) ?? []) {
        stack.push(child);
      }
    }
    return result;
  }

  private isClanManager(actor: RequestUser): boolean {
    return actor.permissions.includes(PERMISSIONS.CLAN_MANAGE);
  }

  private async assertCanManageBranchScope(
    actor: RequestUser,
    branchScopeId: string | null,
    notificationScope: NotificationScope,
  ) {
    if (this.isClanManager(actor)) {
      return;
    }
    if (notificationScope === 'CLAN' || !branchScopeId) {
      throw new ForbiddenException({
        code: 'SCOPE_FORBIDDEN',
        message:
          'Trưởng chi chỉ quản lý ngày giỗ trong chi/nhánh phụ trách, không đặt phạm vi toàn họ.',
      });
    }
    const managed = await this.resolveManagedBranchIds(actor);
    if (!managed.has(branchScopeId)) {
      throw new ForbiddenException({
        code: 'BRANCH_OUT_OF_SCOPE',
        message: 'Ngày giỗ này nằm ngoài chi/nhánh bạn phụ trách.',
      });
    }
  }

  private async assertCanManageEventScope(
    actor: RequestUser,
    visibility: EventVisibility,
    branchId: string | null,
  ) {
    if (this.isClanManager(actor)) {
      return;
    }
    if (visibility === 'CLAN' || !branchId) {
      throw new ForbiddenException({
        code: 'SCOPE_FORBIDDEN',
        message: 'Trưởng chi chỉ quản lý sự kiện trong chi/nhánh phụ trách.',
      });
    }
    const managed = await this.resolveManagedBranchIds(actor);
    if (!managed.has(branchId)) {
      throw new ForbiddenException({
        code: 'BRANCH_OUT_OF_SCOPE',
        message: 'Sự kiện này nằm ngoài chi/nhánh bạn phụ trách.',
      });
    }
  }

  private resolveEventStatus(
    actor: RequestUser,
    requested: EventStatus,
  ): EventStatus {
    if (requested === 'PUBLISHED' || requested === 'COMPLETED') {
      if (!actor.permissions.includes(PERMISSIONS.EVENTS_PUBLISH)) {
        // Without publish rights the event stays a draft.
        return 'DRAFT';
      }
    }
    return requested;
  }

  // ----- Generic helpers -----

  private computeSolarCache(
    lunarDay: number,
    lunarMonth: number,
    isLeapMonth: boolean,
  ): { date: string; year: number } {
    const year = new Date().getFullYear();
    const date = this.lunar.resolveAnniversaryIso(
      lunarDay,
      lunarMonth,
      isLeapMonth,
      year,
    );
    return { date, year };
  }

  private toVietnamDate(iso: string): string {
    return VIETNAM_DATE_FORMATTER.format(new Date(iso));
  }

  private assertDateRange(start: string, end?: string | null) {
    if (end && new Date(end).getTime() < new Date(start).getTime()) {
      throw new BadRequestException({
        code: 'EVENT_RANGE_INVALID',
        message: 'Thời gian kết thúc không thể trước thời gian bắt đầu.',
      });
    }
  }

  private async findClanOrThrow() {
    const clan = await this.genealogy.getClan();
    if (!clan) {
      throw new BadRequestException({
        code: 'CLAN_NOT_CONFIGURED',
        message: 'Cần cấu hình thông tin dòng họ trước.',
      });
    }
    return clan;
  }

  private async findPersonOrThrow(id: string): Promise<PersonRecord> {
    const person = await this.genealogy.findPerson(id);
    if (!person) {
      throw new NotFoundException({
        code: 'PERSON_NOT_FOUND',
        message: 'Không tìm thấy thành viên.',
      });
    }
    return person;
  }

  private async findBranchOrThrow(id: string): Promise<BranchRecord> {
    const branch = await this.genealogy.findBranch(id);
    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'Không tìm thấy chi/nhánh.',
      });
    }
    return branch;
  }
}

function normalizeText(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
