import { Transform } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  CHANGE_REQUEST_ENTITY_TYPES,
  CHANGE_REQUEST_TYPES,
} from '../change-requests.types';

function emptyToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

export class CreateChangeRequestDto {
  @IsIn(CHANGE_REQUEST_ENTITY_TYPES)
  entityType!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  entityId?: string;

  @IsIn(CHANGE_REQUEST_TYPES)
  requestType!: string;

  @IsObject()
  proposedData!: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class ReviewChangeRequestDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;
}
