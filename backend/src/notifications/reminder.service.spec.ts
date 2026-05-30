import { ConfigService } from '@nestjs/config';
import { CalendarRepository } from '../calendar/calendar.repository';
import { CalendarService } from '../calendar/calendar.service';
import { LunarCalendarService } from '../calendar/lunar/lunar-calendar.service';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { GenealogyService } from '../genealogy/genealogy.service';
import { PERMISSIONS } from '../users/user.types';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { EmailService } from './email/email.service';
import { NotificationsRepository } from './notifications.repository';
import { ReminderService } from './reminder.service';

const configStub = { get: () => undefined } as unknown as ConfigService;

function clanManager(): RequestUser {
  return {
    id: 'admin-1',
    employeeCode: 'ADMIN001',
    name: 'Quản trị',
    roles: [],
    permissions: [
      PERMISSIONS.CLAN_MANAGE,
      PERMISSIONS.EVENTS_MANAGE,
      PERMISSIONS.EVENTS_PUBLISH,
    ],
    defaultPath: '/dashboard',
  };
}

async function makeReminderFixture() {
  const genealogyRepo = new GenealogyRepository();
  const genealogy = new GenealogyService(genealogyRepo);
  await genealogy.upsertClan({ name: 'Dòng họ Nguyễn Trí' });
  const calendarRepo = new CalendarRepository();
  const calendar = new CalendarService(
    calendarRepo,
    genealogyRepo,
    new LunarCalendarService(),
  );
  const usersRepo = new UsersRepository();
  const usersService = new UsersService(usersRepo, configStub);
  const notifRepo = new NotificationsRepository();
  const email = new EmailService(configStub);
  const reminder = new ReminderService(
    calendar,
    genealogyRepo,
    usersService,
    notifRepo,
    email,
    configStub,
  );
  return { genealogy, calendar, usersService, notifRepo, reminder };
}

function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe('ReminderService', () => {
  it('creates in-app reminders and never duplicates them', async () => {
    const { calendar, reminder, notifRepo, usersService } =
      await makeReminderFixture();

    await calendar.createEvent(
      {
        title: 'Giỗ Tổ',
        eventType: 'ANCESTOR_ANNIVERSARY',
        startDatetime: inDays(3),
        visibilityScope: 'CLAN',
        status: 'PUBLISHED',
      },
      clanManager(),
    );

    const firstRun = await reminder.runReminders();
    expect(firstRun.created).toBeGreaterThan(0);

    const admin = (await usersService.listAccounts())[0];
    const adminNotifications = await notifRepo.listForUser(admin.id);
    expect(adminNotifications).toHaveLength(1);
    expect(adminNotifications[0].status).toBe('SENT');

    const secondRun = await reminder.runReminders();
    expect(secondRun.created).toBe(0);
    expect(secondRun.skipped).toBe(firstRun.created);

    const afterSecond = await notifRepo.listForUser(admin.id);
    expect(afterSecond).toHaveLength(1);
  });

  it('does not remind for events outside the notify window', async () => {
    const { calendar, reminder, notifRepo, usersService } =
      await makeReminderFixture();

    await calendar.createEvent(
      {
        title: 'Sự kiện xa',
        eventType: 'OTHER',
        startDatetime: inDays(40),
        visibilityScope: 'CLAN',
        status: 'PUBLISHED',
      },
      clanManager(),
    );

    const run = await reminder.runReminders();
    expect(run.created).toBe(0);

    const admin = (await usersService.listAccounts())[0];
    expect(await notifRepo.listForUser(admin.id)).toHaveLength(0);
  });
});
