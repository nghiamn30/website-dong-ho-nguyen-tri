import { RequestUser } from '../common/interfaces/request-user.interface';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { GenealogyService } from '../genealogy/genealogy.service';
import { PERMISSIONS } from '../users/user.types';
import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';
import { LunarCalendarService } from './lunar/lunar-calendar.service';

function clanManager(overrides: Partial<RequestUser> = {}): RequestUser {
  return {
    id: 'admin-1',
    employeeCode: 'ADMIN001',
    name: 'Quản trị',
    roles: [],
    permissions: [
      PERMISSIONS.CLAN_MANAGE,
      PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE,
      PERMISSIONS.EVENTS_MANAGE,
      PERMISSIONS.EVENTS_PUBLISH,
    ],
    defaultPath: '/dashboard',
    ...overrides,
  };
}

function branchHead(personId: string): RequestUser {
  return {
    id: `user-${personId}`,
    employeeCode: 'CHI001',
    name: 'Trưởng chi',
    personId,
    roles: [],
    permissions: [
      PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE,
      PERMISSIONS.EVENTS_MANAGE,
    ],
    defaultPath: '/dashboard',
  };
}

async function makeFixture() {
  const genealogyRepo = new GenealogyRepository();
  const genealogy = new GenealogyService(genealogyRepo);
  await genealogy.upsertClan({ name: 'Dòng họ Nguyễn Trí' });
  const lunar = new LunarCalendarService();
  const calendarRepo = new CalendarRepository();
  const calendar = new CalendarService(calendarRepo, genealogyRepo, lunar);
  return { genealogy, genealogyRepo, calendar, calendarRepo, lunar };
}

describe('CalendarService - death anniversaries', () => {
  it('defaults the scope to the deceased branch', async () => {
    const { genealogy, calendar } = await makeFixture();
    const branch = await genealogy.createBranch({ name: 'Chi Một' });
    const deceased = await genealogy.createPerson({
      fullName: 'Cụ Tổ Chi Một',
      gender: 'MALE',
      branchId: branch.id,
      lifeStatus: 'DECEASED',
      deathSolarDate: '1990-01-01',
    });

    const anniversary = await calendar.createAnniversary(
      { personId: deceased.id, lunarDay: 10, lunarMonth: 3 },
      clanManager(),
    );

    expect(anniversary.notificationScope).toBe('BRANCH');
    expect(anniversary.branchScopeId).toBe(branch.id);
    expect(anniversary.solarDateCache).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('lets a branch head manage anniversaries inside their branch only', async () => {
    const { genealogy, calendar } = await makeFixture();
    const branchA = await genealogy.createBranch({ name: 'Chi A' });
    const branchB = await genealogy.createBranch({ name: 'Chi B' });

    const headA = await genealogy.createPerson({
      fullName: 'Trưởng chi A',
      gender: 'MALE',
      branchId: branchA.id,
      lifeStatus: 'LIVING',
    });
    await genealogy.updateBranch(branchA.id, { headPersonId: headA.id });

    const deceasedA = await genealogy.createPerson({
      fullName: 'Người mất A',
      gender: 'MALE',
      branchId: branchA.id,
      lifeStatus: 'DECEASED',
      deathSolarDate: '2001-02-02',
    });
    const deceasedB = await genealogy.createPerson({
      fullName: 'Người mất B',
      gender: 'FEMALE',
      branchId: branchB.id,
      lifeStatus: 'DECEASED',
      deathSolarDate: '2002-03-03',
    });

    const actor = branchHead(headA.id);

    const created = await calendar.createAnniversary(
      { personId: deceasedA.id, lunarDay: 5, lunarMonth: 4 },
      actor,
    );
    expect(created.branchScopeId).toBe(branchA.id);

    await expect(
      calendar.createAnniversary(
        { personId: deceasedB.id, lunarDay: 6, lunarMonth: 4 },
        actor,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('forbids a branch head from setting a clan-wide scope', async () => {
    const { genealogy, calendar } = await makeFixture();
    const branchA = await genealogy.createBranch({ name: 'Chi A' });
    const headA = await genealogy.createPerson({
      fullName: 'Trưởng chi A',
      gender: 'MALE',
      branchId: branchA.id,
      lifeStatus: 'LIVING',
    });
    await genealogy.updateBranch(branchA.id, { headPersonId: headA.id });
    const deceasedA = await genealogy.createPerson({
      fullName: 'Người mất A',
      gender: 'MALE',
      branchId: branchA.id,
      lifeStatus: 'DECEASED',
      deathSolarDate: '2001-02-02',
    });

    await expect(
      calendar.createAnniversary(
        {
          personId: deceasedA.id,
          lunarDay: 5,
          lunarMonth: 4,
          notificationScope: 'CLAN',
        },
        branchHead(headA.id),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects anniversaries for living people', async () => {
    const { genealogy, calendar } = await makeFixture();
    const person = await genealogy.createPerson({
      fullName: 'Người còn sống',
      gender: 'MALE',
      lifeStatus: 'LIVING',
    });
    await expect(
      calendar.createAnniversary(
        { personId: person.id, lunarDay: 1, lunarMonth: 1 },
        clanManager(),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('CalendarService - events', () => {
  it('keeps events as draft when the actor cannot publish', async () => {
    const { genealogy, calendar } = await makeFixture();
    const branch = await genealogy.createBranch({ name: 'Chi A' });
    const head = await genealogy.createPerson({
      fullName: 'Trưởng chi A',
      gender: 'MALE',
      branchId: branch.id,
      lifeStatus: 'LIVING',
    });
    await genealogy.updateBranch(branch.id, { headPersonId: head.id });

    const event = await calendar.createEvent(
      {
        title: 'Họp chi A',
        eventType: 'CLAN_MEETING',
        startDatetime: '2025-12-01T09:00:00+07:00',
        visibilityScope: 'BRANCH',
        branchId: branch.id,
        status: 'PUBLISHED',
      },
      branchHead(head.id),
    );
    expect(event.status).toBe('DRAFT');
  });

  it('generates auto events from anniversaries idempotently', async () => {
    const { genealogy, calendar } = await makeFixture();
    const branch = await genealogy.createBranch({ name: 'Chi A' });
    const deceased = await genealogy.createPerson({
      fullName: 'Cụ Tổ',
      gender: 'MALE',
      branchId: branch.id,
      lifeStatus: 'DECEASED',
      deathSolarDate: '1980-01-01',
    });
    await calendar.createAnniversary(
      { personId: deceased.id, lunarDay: 10, lunarMonth: 3 },
      clanManager(),
    );

    const first = await calendar.generateEventsForYear(2025, clanManager());
    expect(first.created).toBe(1);
    expect(first.events[0].status).toBe('PUBLISHED');
    expect(first.events[0].eventType).toBe('DEATH_ANNIVERSARY');

    const second = await calendar.generateEventsForYear(2025, clanManager());
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(1);
  });

  it('returns month events grouped by Vietnam day', async () => {
    const { calendar } = await makeFixture();
    await calendar.createEvent(
      {
        title: 'Sự kiện tháng 12',
        eventType: 'OTHER',
        startDatetime: '2025-12-15T10:00:00+07:00',
        visibilityScope: 'CLAN',
        status: 'PUBLISHED',
      },
      clanManager(),
    );
    const month = await calendar.getMonth(2025, 12);
    expect(month.days).toHaveLength(31);
    const day15 = month.days.find((day) => day.date === '2025-12-15');
    expect(day15?.events).toHaveLength(1);
  });
});
