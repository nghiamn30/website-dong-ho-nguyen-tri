import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CalendarService } from '../calendar/calendar.service';
import { EventRecord } from '../calendar/calendar.types';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { UsersService } from '../users/users.service';
import { UserRecord } from '../users/user.types';
import { EmailService } from './email/email.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationChannel } from './notifications.types';

const VIETNAM_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DEFAULT_DAYS_BEFORE = 7;
const MAX_LOOKAHEAD_DAYS = 60;

export interface ReminderRunResult {
  scannedEvents: number;
  created: number;
  skipped: number;
  emailFailed: number;
}

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly genealogy: GenealogyRepository,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Scan upcoming published events and create reminder notifications for the
   * resolved audience. Idempotent: a notification is created at most once per
   * (event, user, channel) thanks to a stable reminder key.
   */
  async runReminders(
    referenceDate: Date = new Date(),
  ): Promise<ReminderRunResult> {
    const fromIso = referenceDate.toISOString();
    const toIso = new Date(
      referenceDate.getTime() + MAX_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [events, accounts, persons, branches] = await Promise.all([
      this.calendarService.listEvents({
        from: fromIso,
        to: toIso,
        status: 'PUBLISHED',
      }),
      this.usersService.listAccounts(),
      this.genealogy.listPersons(),
      this.genealogy.listBranches(),
    ]);

    const activeAccounts = accounts.filter((account) => account.isActive);
    const personBranch = new Map<string, string | undefined>(
      persons.map((person) => [person.id, person.branchId]),
    );

    const result: ReminderRunResult = {
      scannedEvents: events.length,
      created: 0,
      skipped: 0,
      emailFailed: 0,
    };

    const today = this.toVietnamDate(referenceDate.toISOString());

    for (const event of events) {
      const daysUntil = this.daysBetween(
        today,
        this.toVietnamDate(event.startDatetime),
      );
      if (daysUntil < 0) {
        continue;
      }
      const notifyBeforeDays = await this.resolveNotifyBeforeDays(event);
      if (daysUntil > notifyBeforeDays) {
        continue;
      }

      const audience = this.resolveAudience(
        event,
        activeAccounts,
        personBranch,
        branches,
      );

      for (const account of audience) {
        const settings = await this.resolveSettings(account.id);
        const channels = this.resolveChannels(settings);
        for (const channel of channels) {
          const created = await this.emitNotification(
            event,
            account,
            channel,
            settings.email,
          );
          if (created === 'skipped') {
            result.skipped += 1;
          } else if (created === 'created') {
            result.created += 1;
          } else if (created === 'email-failed') {
            result.created += 1;
            result.emailFailed += 1;
          }
        }
      }
    }

    this.logger.log(
      `Reminder run: scanned=${result.scannedEvents} created=${result.created} skipped=${result.skipped} emailFailed=${result.emailFailed}`,
    );
    return result;
  }

  private async emitNotification(
    event: EventRecord,
    account: UserRecord,
    channel: NotificationChannel,
    email: string | undefined,
  ): Promise<'created' | 'skipped' | 'email-failed'> {
    const reminderKey = `event:${event.id}:user:${account.id}:${channel}`;
    if (await this.notifications.existsByReminderKey(reminderKey)) {
      return 'skipped';
    }

    const eventDate = this.toVietnamDate(event.startDatetime);
    const title = event.title;
    const content = `Sự kiện "${event.title}" sẽ diễn ra ngày ${eventDate}.`;

    if (channel === 'EMAIL') {
      const recipient = email ?? '';
      const sendResult = await this.emailService.send({
        to: recipient,
        subject: title,
        body: content,
      });
      await this.notifications.create({
        userId: account.id,
        eventId: event.id,
        channel,
        reminderKey,
        title,
        content,
        status: sendResult.delivered ? 'SENT' : 'FAILED',
        sentAt: sendResult.delivered ? new Date().toISOString() : null,
        errorMessage: sendResult.error ?? null,
      });
      return sendResult.delivered ? 'created' : 'email-failed';
    }

    await this.notifications.create({
      userId: account.id,
      eventId: event.id,
      channel,
      reminderKey,
      title,
      content,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      errorMessage: null,
    });
    return 'created';
  }

  private resolveChannels(settings: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    email?: string;
  }): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    if (settings.inAppEnabled) {
      channels.push('IN_APP');
    }
    if (
      settings.emailEnabled &&
      this.emailService.isEnabled() &&
      settings.email
    ) {
      channels.push('EMAIL');
    }
    return channels;
  }

  private async resolveSettings(userId: string) {
    const setting = await this.notifications.getSetting(userId);
    if (setting) {
      return setting;
    }
    return { inAppEnabled: true, emailEnabled: false, email: undefined };
  }

  private resolveAudience(
    event: EventRecord,
    accounts: UserRecord[],
    personBranch: Map<string, string | undefined>,
    branches: { id: string; parentBranchId?: string }[],
  ): UserRecord[] {
    if (event.visibilityScope === 'CLAN' || !event.branchId) {
      return accounts;
    }
    const subtree = this.collectSubtree(branches, event.branchId);
    return accounts.filter((account) => {
      if (!account.personId) {
        return false;
      }
      const branchId = personBranch.get(account.personId);
      return branchId ? subtree.has(branchId) : false;
    });
  }

  private collectSubtree(
    branches: { id: string; parentBranchId?: string }[],
    rootId: string,
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
    const stack = [rootId];
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

  private async resolveNotifyBeforeDays(event: EventRecord): Promise<number> {
    if (event.sourceType === 'AUTO_ANNIVERSARY' && event.sourceId) {
      try {
        const anniversary = await this.calendarService.getAnniversary(
          event.sourceId,
        );
        return anniversary.notifyBeforeDays;
      } catch {
        // Anniversary was removed; fall back to the default window.
      }
    }
    const configured = Number(
      this.configService.get<string>('REMINDER_DEFAULT_DAYS_BEFORE') ??
        DEFAULT_DAYS_BEFORE,
    );
    return Number.isFinite(configured) ? configured : DEFAULT_DAYS_BEFORE;
  }

  private toVietnamDate(iso: string): string {
    return VIETNAM_DATE_FORMATTER.format(new Date(iso));
  }

  private daysBetween(fromDate: string, toDate: string): number {
    const from = Date.parse(`${fromDate}T00:00:00Z`);
    const to = Date.parse(`${toDate}T00:00:00Z`);
    return Math.round((to - from) / (24 * 60 * 60 * 1000));
  }
}
