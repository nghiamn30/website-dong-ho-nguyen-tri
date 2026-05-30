import { convertLunarToSolar, convertSolarToLunar } from './lunar-calendar';
import { LunarCalendarService } from './lunar-calendar.service';

describe('lunar-calendar conversion', () => {
  // Reference values cross-checked with the Ho Ngoc Duc lunar calendar.
  const cases: Array<{
    solar: [number, number, number];
    lunar: [number, number, number, boolean];
  }> = [
    // 2014-09-08 (Tet Trung Thu) <-> 15/8 lunar 2014
    { solar: [8, 9, 2014], lunar: [15, 8, 2014, false] },
    // Vietnamese Tet 2024 (Giap Thin): 2024-02-10 <-> 1/1 lunar 2024
    { solar: [10, 2, 2024], lunar: [1, 1, 2024, false] },
    // Tet 2023: 2023-01-22 <-> 1/1 lunar 2023
    { solar: [22, 1, 2023], lunar: [1, 1, 2023, false] },
    // Hung Kings (gio To): 10/3 lunar 2025 -> 2025-04-07
    { solar: [7, 4, 2025], lunar: [10, 3, 2025, false] },
  ];

  it('round-trips solar -> lunar -> solar', () => {
    for (const { solar, lunar } of cases) {
      const [dd, mm, yy] = solar;
      const computedLunar = convertSolarToLunar(dd, mm, yy);
      expect([
        computedLunar.day,
        computedLunar.month,
        computedLunar.year,
        computedLunar.isLeapMonth,
      ]).toEqual(lunar);

      const back = convertLunarToSolar(
        computedLunar.day,
        computedLunar.month,
        computedLunar.year,
        computedLunar.isLeapMonth,
      );
      expect([back.day, back.month, back.year]).toEqual(solar);
    }
  });

  it('handles a leap month (leap 4th month exists in 2025 lunar year)', () => {
    // Lunar year 2025 (At Ty) has a leap 6th month. Confirm the flag survives
    // a round trip for a date inside it.
    const leapMonth = findLeapMonthOfLunarYear(2025);
    expect(leapMonth).not.toBeNull();
    const solar = convertLunarToSolar(1, leapMonth!, 2025, true);
    const lunar = convertSolarToLunar(solar.day, solar.month, solar.year);
    expect(lunar.isLeapMonth).toBe(true);
    expect(lunar.month).toBe(leapMonth);
    expect(lunar.year).toBe(2025);
  });
});

describe('LunarCalendarService', () => {
  const service = new LunarCalendarService();

  it('converts an ISO solar date to lunar', () => {
    expect(service.solarToLunar('2024-02-10')).toEqual({
      day: 1,
      month: 1,
      year: 2024,
      isLeapMonth: false,
    });
  });

  it('converts a lunar date to an ISO solar date', () => {
    expect(service.lunarToSolarIso(15, 8, 2014)).toBe('2014-09-08');
  });

  it('resolves a recurring lunar anniversary into the requested solar year', () => {
    // 10/3 lunar (Hung Kings) resolves into different solar dates each year.
    expect(service.resolveAnniversaryIso(10, 3, false, 2025)).toBe(
      '2025-04-07',
    );
    const in2026 = service.resolveAnniversaryIso(10, 3, false, 2026);
    expect(in2026.startsWith('2026-')).toBe(true);
  });

  it('rejects invalid lunar input', () => {
    expect(() => service.lunarToSolarIso(40, 1, 2024)).toThrow();
    expect(() => service.lunarToSolarIso(1, 13, 2024)).toThrow();
  });

  it('rejects malformed solar input', () => {
    expect(() => service.solarToLunar('10/02/2024')).toThrow();
  });
});

function findLeapMonthOfLunarYear(lunarYear: number): number | null {
  // Scan solar dates of the lunar year and detect a leap month, if any.
  for (let month = 1; month <= 12; month += 1) {
    const solar = convertLunarToSolar(1, month, lunarYear, true);
    const lunar = convertSolarToLunar(solar.day, solar.month, solar.year);
    if (
      lunar.isLeapMonth &&
      lunar.month === month &&
      lunar.year === lunarYear
    ) {
      return month;
    }
  }
  return null;
}
