const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DEFAULT_LOCALE = "vi-VN";

const vietnamPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VIETNAM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatInVietnamTimeZone(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: VIETNAM_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  return formatInVietnamTimeZone(value, {
    dateStyle: "short",
    timeStyle: "short",
    ...options,
  });
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  return formatInVietnamTimeZone(value, {
    dateStyle: "medium",
    ...options,
  });
}

export function formatTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  return formatInVietnamTimeZone(value, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...options,
  });
}

export function toDateInputValue(date: Date) {
  const parts = toVietnamDateTimeParts(date);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function toTimeInputValue(date: Date) {
  const parts = toVietnamDateTimeParts(date);

  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function toDateTimeInputValue(date: Date) {
  return `${toDateInputValue(date)}T${toTimeInputValue(date)}`;
}

function toVietnamDateTimeParts(date: Date) {
  const parts = vietnamPartsFormatter.formatToParts(date);
  const lookup: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
