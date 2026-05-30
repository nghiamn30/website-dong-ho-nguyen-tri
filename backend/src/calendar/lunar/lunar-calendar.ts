/**
 * Vietnamese lunar <-> solar calendar conversion.
 *
 * Port of the widely used algorithm by Ho Ngoc Duc, itself based on
 * "Astronomical Algorithms" (Jean Meeus). All calculations use the
 * Vietnam time zone offset (UTC+7) by default so the converted dates match
 * the civil lunar calendar used inside the country.
 *
 * The functions here are pure so they can be unit tested in isolation.
 */

export const VIETNAM_TIME_ZONE_OFFSET = 7;

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

const PI = Math.PI;

/** Julian day number from a Gregorian (or Julian) calendar date at noon. */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

/** Convert a Julian day number back to a Gregorian calendar date. */
export function jdToDate(jd: number): SolarDate {
  let a: number;
  let b: number;
  let c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

/**
 * Julian day number (in the given time zone) of the k-th new moon since the
 * known new moon of 1900-01-01.
 */
function newMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 =
    C1 -
    0.0074 * Math.sin(dr * (M - Mpr)) +
    0.0004 * Math.sin(dr * (2 * F + M));
  C1 =
    C1 -
    0.0004 * Math.sin(dr * (2 * F - M)) -
    0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 =
    C1 +
    0.001 * Math.sin(dr * (2 * F - Mpr)) +
    0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat: number;
  if (T < -11) {
    deltat =
      0.001 +
      0.000839 * T +
      0.0002261 * T2 -
      0.00000845 * T3 -
      0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

/** Sun ecliptic longitude (in degrees, 0..360) at the given Julian day number. */
function sunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL =
    DL +
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L - 360 * Math.floor(L / 360);
  return L;
}

/** Index (0..11) of the 30-degree solar term containing the given day. */
function sunLongitudeTerm(dayNumber: number, timeZone: number): number {
  return Math.floor((sunLongitude(dayNumber, timeZone) / 360) * 12);
}

/** Julian day number of the lunar month 11 (containing the winter solstice). */
function lunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = newMoonDay(k, timeZone);
  const sunLong = sunLongitudeTerm(nm, timeZone);
  if (sunLong >= 9) {
    nm = newMoonDay(k - 1, timeZone);
  }
  return nm;
}

/** Offset of the leap month after lunar month 11 of year a11. */
function leapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = sunLongitudeTerm(newMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i += 1;
    arc = sunLongitudeTerm(newMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Convert a solar (Gregorian) date to the Vietnamese lunar date. */
export function convertSolarToLunar(
  dd: number,
  mm: number,
  yy: number,
  timeZone: number = VIETNAM_TIME_ZONE_OFFSET,
): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = newMoonDay(k, timeZone);
  }
  let a11 = lunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = lunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = lunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = leapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeapMonth: lunarLeap,
  };
}

/** Convert a Vietnamese lunar date to the solar (Gregorian) date. */
export function convertLunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean,
  timeZone: number = VIETNAM_TIME_ZONE_OFFSET,
): SolarDate {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = lunarMonth11(lunarYear - 1, timeZone);
    b11 = lunarMonth11(lunarYear, timeZone);
  } else {
    a11 = lunarMonth11(lunarYear, timeZone);
    b11 = lunarMonth11(lunarYear + 1, timeZone);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }
  if (b11 - a11 > 365) {
    const leapOff = leapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }
    if (lunarLeap && lunarMonth !== leapMonth) {
      // The requested month is not actually the leap month; ignore the flag.
    }
    if (lunarLeap || off >= leapOff) {
      off += 1;
    }
  }
  const monthStart = newMoonDay(k + off, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

/**
 * Resolve the solar calendar date of a recurring lunar anniversary in the
 * requested solar year. The anniversary recurs every lunar year on the same
 * lunar day/month; we find the lunar year whose computed solar date falls in
 * the requested year. When the lunar month does not exist as a leap month in
 * that year, the leap flag is dropped automatically by the conversion.
 */
export function resolveLunarAnniversaryInSolarYear(
  lunarDay: number,
  lunarMonth: number,
  isLeapMonth: boolean,
  solarYear: number,
  timeZone: number = VIETNAM_TIME_ZONE_OFFSET,
): SolarDate {
  // Try the matching lunar year first, then neighbours, to land in solarYear.
  for (const candidateYear of [solarYear, solarYear - 1, solarYear + 1]) {
    const solar = convertLunarToSolar(
      lunarDay,
      lunarMonth,
      candidateYear,
      isLeapMonth,
      timeZone,
    );
    if (solar.year === solarYear) {
      return solar;
    }
  }
  // Fallback: return the conversion for the requested lunar year directly.
  return convertLunarToSolar(
    lunarDay,
    lunarMonth,
    solarYear,
    isLeapMonth,
    timeZone,
  );
}
