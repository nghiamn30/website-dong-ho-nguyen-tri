import { BadRequestException, Injectable } from '@nestjs/common';
import {
  convertLunarToSolar,
  convertSolarToLunar,
  LunarDate,
  resolveLunarAnniversaryInSolarYear,
  SolarDate,
} from './lunar-calendar';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class LunarCalendarService {
  /** Convert an ISO solar date string (YYYY-MM-DD) to a lunar date. */
  solarToLunar(isoDate: string): LunarDate {
    const { day, month, year } = this.parseIsoDate(isoDate);
    return convertSolarToLunar(day, month, year);
  }

  /** Convert a lunar date to an ISO solar date string (YYYY-MM-DD). */
  lunarToSolarIso(
    lunarDay: number,
    lunarMonth: number,
    lunarYear: number,
    isLeapMonth = false,
  ): string {
    this.assertLunarDayMonth(lunarDay, lunarMonth);
    const solar = convertLunarToSolar(
      lunarDay,
      lunarMonth,
      lunarYear,
      isLeapMonth,
    );
    return this.toIsoDate(solar);
  }

  /**
   * Resolve the solar ISO date of a recurring lunar anniversary (day + month,
   * with optional leap flag) within a given solar year.
   */
  resolveAnniversaryIso(
    lunarDay: number,
    lunarMonth: number,
    isLeapMonth: boolean,
    solarYear: number,
  ): string {
    this.assertLunarDayMonth(lunarDay, lunarMonth);
    const solar = resolveLunarAnniversaryInSolarYear(
      lunarDay,
      lunarMonth,
      isLeapMonth,
      solarYear,
    );
    return this.toIsoDate(solar);
  }

  private toIsoDate(solar: SolarDate): string {
    const month = String(solar.month).padStart(2, '0');
    const day = String(solar.day).padStart(2, '0');
    return `${solar.year}-${month}-${day}`;
  }

  private parseIsoDate(isoDate: string): SolarDate {
    if (!ISO_DATE.test(isoDate)) {
      throw new BadRequestException({
        code: 'INVALID_SOLAR_DATE',
        message: 'Ngày dương phải có dạng YYYY-MM-DD.',
      });
    }
    const [year, month, day] = isoDate.split('-').map((part) => Number(part));
    return { year, month, day };
  }

  private assertLunarDayMonth(lunarDay: number, lunarMonth: number) {
    if (
      !Number.isInteger(lunarDay) ||
      lunarDay < 1 ||
      lunarDay > 30 ||
      !Number.isInteger(lunarMonth) ||
      lunarMonth < 1 ||
      lunarMonth > 12
    ) {
      throw new BadRequestException({
        code: 'INVALID_LUNAR_DATE',
        message: 'Ngày âm phải có ngày 1-30 và tháng 1-12.',
      });
    }
  }
}
