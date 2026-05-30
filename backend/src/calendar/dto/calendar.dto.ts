import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  EVENT_VISIBILITIES,
  NOTIFICATION_SCOPES,
  RECURRENCE_TYPES,
} from '../calendar.types';

function emptyToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

export class CreateDeathAnniversaryDto {
  @IsUUID()
  personId!: string;

  @IsInt()
  @Min(1)
  @Max(30)
  lunarDay!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  lunarMonth!: number;

  @IsOptional()
  @IsBoolean()
  isLeapMonth?: boolean;

  @IsOptional()
  @IsIn(RECURRENCE_TYPES)
  recurrenceType?: (typeof RECURRENCE_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchScopeId?: string;

  @IsOptional()
  @IsIn(NOTIFICATION_SCOPES)
  notificationScope?: (typeof NOTIFICATION_SCOPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  notifyBeforeDays?: number;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  ceremonyNote?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateDeathAnniversaryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  lunarDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  lunarMonth?: number;

  @IsOptional()
  @IsBoolean()
  isLeapMonth?: boolean;

  @IsOptional()
  @IsIn(RECURRENCE_TYPES)
  recurrenceType?: (typeof RECURRENCE_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchScopeId?: string;

  @IsOptional()
  @IsIn(NOTIFICATION_SCOPES)
  notificationScope?: (typeof NOTIFICATION_SCOPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  notifyBeforeDays?: number;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  ceremonyNote?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsISO8601()
  startDatetime!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsISO8601()
  endDatetime?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsIn(EVENT_VISIBILITIES)
  visibilityScope?: (typeof EVENT_VISIBILITIES)[number];

  @IsOptional()
  @IsIn(EVENT_STATUSES)
  status?: (typeof EVENT_STATUSES)[number];
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(EVENT_TYPES)
  eventType?: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsISO8601()
  startDatetime?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsISO8601()
  endDatetime?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsIn(EVENT_VISIBILITIES)
  visibilityScope?: (typeof EVENT_VISIBILITIES)[number];

  @IsOptional()
  @IsIn(EVENT_STATUSES)
  status?: (typeof EVENT_STATUSES)[number];
}

export class GenerateEventsDto {
  @IsInt()
  @Min(1900)
  @Max(2200)
  @Type(() => Number)
  year!: number;
}
