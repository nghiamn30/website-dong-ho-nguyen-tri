import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CalendarModule } from '../calendar/calendar.module';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { UsersModule } from '../users/users.module';
import { EmailService } from './email/email.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { ReminderService } from './reminder.service';

@Module({
  imports: [AuditLogModule, CalendarModule, GenealogyModule, UsersModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    ReminderService,
    EmailService,
  ],
  exports: [NotificationsService, ReminderService, NotificationsRepository],
})
export class NotificationsModule {}
