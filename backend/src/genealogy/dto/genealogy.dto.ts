import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CALENDAR_TYPES,
  GENDERS,
  LIFE_STATUSES,
  RELATIONSHIP_TYPES,
} from '../genealogy.types';

function emptyToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function trimOptional(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertClanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  history?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  founderPersonId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(180)
  ancestralHouseName?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  ancestralHouseAddress?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  contactInformation?: string;
}

export class CreateBranchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  parentBranchId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  headPersonId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  displayOrder?: number;
}

export class UpdateBranchDto extends CreateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  declare name: string;
}

export class CreatePersonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  fullName!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(180)
  commonName?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  generationNumber?: number;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsIn(CALENDAR_TYPES)
  birthCalendarType?: string;

  @IsOptional()
  @IsIn(LIFE_STATUSES)
  lifeStatus?: string;

  @IsOptional()
  @IsBoolean()
  isBranchHead?: boolean;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  biography?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(180)
  hometown?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(180)
  currentLocation?: string;
}

export class UpdatePersonDto extends CreatePersonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  declare fullName: string;
}

export class CreateRelationshipDto {
  @IsUUID()
  person1Id!: string;

  @IsUUID()
  person2Id!: string;

  @IsIn(RELATIONSHIP_TYPES)
  relationshipType!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  note?: string;
}
