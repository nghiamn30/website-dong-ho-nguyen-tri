import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { CalendarController } from './calendar.controller';
import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';
import { LunarCalendarService } from './lunar/lunar-calendar.service';

@Module({
  imports: [AuditLogModule, GenealogyModule],
  controllers: [CalendarController],
  providers: [CalendarRepository, CalendarService, LunarCalendarService],
  exports: [CalendarRepository, CalendarService, LunarCalendarService],
})
export class CalendarModule {}
