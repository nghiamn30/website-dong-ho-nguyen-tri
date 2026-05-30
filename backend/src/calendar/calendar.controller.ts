import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { CalendarService } from './calendar.service';
import { CALENDAR_PERMISSIONS } from './calendar.types';
import type { EventStatus } from './calendar.types';
import {
  CreateDeathAnniversaryDto,
  CreateEventDto,
  GenerateEventsDto,
  UpdateDeathAnniversaryDto,
  UpdateEventDto,
} from './dto/calendar.dto';
import { LunarCalendarService } from './lunar/lunar-calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly lunarService: LunarCalendarService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ----- Lunar conversion utility -----

  @Get('lunar/convert')
  convertLunar(
    @Query('solar') solar?: string,
    @Query('lunarDay') lunarDay?: string,
    @Query('lunarMonth') lunarMonth?: string,
    @Query('lunarYear') lunarYear?: string,
    @Query('isLeapMonth') isLeapMonth?: string,
  ) {
    if (solar) {
      return { lunar: this.lunarService.solarToLunar(solar) };
    }
    if (lunarDay && lunarMonth && lunarYear) {
      return {
        solar: this.lunarService.lunarToSolarIso(
          Number(lunarDay),
          Number(lunarMonth),
          Number(lunarYear),
          isLeapMonth === 'true',
        ),
      };
    }
    throw new BadRequestException({
      code: 'CONVERT_INPUT_REQUIRED',
      message: 'Cần truyền solar hoặc lunarDay/lunarMonth/lunarYear.',
    });
  }

  // ----- Calendar views (open to authenticated users) -----

  @Get('month')
  getMonth(@Query('year') year?: string, @Query('month') month?: string) {
    const now = new Date();
    const resolvedYear = year ? Number(year) : now.getFullYear();
    const resolvedMonth = month ? Number(month) : now.getMonth() + 1;
    if (
      !Number.isInteger(resolvedYear) ||
      !Number.isInteger(resolvedMonth) ||
      resolvedMonth < 1 ||
      resolvedMonth > 12
    ) {
      throw new BadRequestException({
        code: 'INVALID_MONTH',
        message: 'Tháng/năm không hợp lệ.',
      });
    }
    return this.calendarService.getMonth(resolvedYear, resolvedMonth);
  }

  @Get('upcoming')
  getUpcoming(
    @Query('limit') limit?: string,
    @Query('withinDays') withinDays?: string,
  ) {
    return this.calendarService.getUpcoming(
      limit ? Number(limit) : undefined,
      withinDays ? Number(withinDays) : undefined,
    );
  }

  // ----- Events -----

  @Get('events')
  listEvents(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: EventStatus,
    @Query('branchId') branchId?: string,
  ) {
    return this.calendarService.listEvents({ from, to, status, branchId });
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    return this.calendarService.getEvent(id);
  }

  @Post('events')
  @Permissions(CALENDAR_PERMISSIONS.EVENTS_MANAGE)
  async createEvent(
    @Body() dto: CreateEventDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.createEvent(dto, actor);
    await this.audit('calendar.events.create', actor, { eventId: result.id });
    return result;
  }

  @Patch('events/:id')
  @Permissions(CALENDAR_PERMISSIONS.EVENTS_MANAGE)
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.updateEvent(id, dto, actor);
    await this.audit('calendar.events.update', actor, { eventId: result.id });
    return result;
  }

  @Delete('events/:id')
  @Permissions(CALENDAR_PERMISSIONS.EVENTS_MANAGE)
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.deleteEvent(id, actor);
    await this.audit('calendar.events.delete', actor, result);
    return result;
  }

  @Post('events/generate')
  @Permissions(
    CALENDAR_PERMISSIONS.EVENTS_MANAGE,
    CALENDAR_PERMISSIONS.EVENTS_PUBLISH,
  )
  async generateEvents(
    @Body() dto: GenerateEventsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.generateEventsForYear(
      dto.year,
      actor,
    );
    await this.audit('calendar.events.generate', actor, {
      year: dto.year,
      created: result.created,
      skipped: result.skipped,
    });
    return result;
  }

  // ----- Death anniversaries -----

  @Get('death-anniversaries')
  listAnniversaries(@Query('personId') personId?: string) {
    return this.calendarService.listAnniversaries(personId);
  }

  @Get('death-anniversaries/:id')
  getAnniversary(@Param('id') id: string) {
    return this.calendarService.getAnniversary(id);
  }

  @Post('death-anniversaries')
  @Permissions(CALENDAR_PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE)
  async createAnniversary(
    @Body() dto: CreateDeathAnniversaryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.createAnniversary(dto, actor);
    await this.audit('calendar.death-anniversaries.create', actor, {
      anniversaryId: result.id,
    });
    return result;
  }

  @Patch('death-anniversaries/:id')
  @Permissions(CALENDAR_PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE)
  async updateAnniversary(
    @Param('id') id: string,
    @Body() dto: UpdateDeathAnniversaryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.updateAnniversary(id, dto, actor);
    await this.audit('calendar.death-anniversaries.update', actor, {
      anniversaryId: result.id,
    });
    return result;
  }

  @Delete('death-anniversaries/:id')
  @Permissions(CALENDAR_PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE)
  async deleteAnniversary(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.calendarService.deleteAnniversary(id, actor);
    await this.audit('calendar.death-anniversaries.delete', actor, result);
    return result;
  }

  private async audit(
    action: string,
    actor: RequestUser,
    metadata?: Record<string, unknown>,
  ) {
    await this.auditLogService.create({
      action,
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      metadata,
    });
  }
}
