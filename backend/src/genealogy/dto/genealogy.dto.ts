import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CALENDAR_TYPES,
  GENDERS,
  LIFE_STATUSES,
  MARRIAGE_STATUSES,
  PARENT_RELATION_TYPES,
  PARENT_ROLES,
} from '../genealogy.types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  @IsString()
  @MaxLength(180)
  commonName?: string;

  @IsIn(GENDERS, { message: 'Giới tính phải là MALE hoặc FEMALE.' })
  gender!: string;

  @IsOptional()
  @IsBoolean()
  isClanMember?: boolean;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

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
  @IsInt()
  @Min(0)
  @Max(100000)
  displayOrder?: number;

  // Ngày sinh
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(CALENDAR_TYPES)
  birthDateSource?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(DATE_PATTERN, {
    message: 'Ngày sinh dương phải có dạng YYYY-MM-DD.',
  })
  birthSolarDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3000)
  birthLunarYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  birthLunarMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  birthLunarDay?: number;

  @IsOptional()
  @IsBoolean()
  birthLunarIsLeapMonth?: boolean;

  // Trạng thái sống/mất
  @IsOptional()
  @IsIn(LIFE_STATUSES)
  lifeStatus?: string;

  // Ngày mất
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(CALENDAR_TYPES)
  deathDateSource?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(DATE_PATTERN, { message: 'Ngày mất dương phải có dạng YYYY-MM-DD.' })
  deathSolarDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3000)
  deathLunarYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  deathLunarMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  deathLunarDay?: number;

  @IsOptional()
  @IsBoolean()
  deathLunarIsLeapMonth?: boolean;

  // Ngày giỗ riêng
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(CALENDAR_TYPES)
  deathAnniversaryCalendar?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  deathAnniversaryMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  deathAnniversaryDay?: number;

  @IsOptional()
  @IsBoolean()
  deathAnniversaryIsLeapMonth?: boolean;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  burialPlace?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  burialMapUrl?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  graveImageUrl?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  deathNote?: string;

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

  @IsOptional()
  @IsIn(GENDERS, { message: 'Giới tính phải là MALE hoặc FEMALE.' })
  declare gender: string;
}

export class CreateParentChildDto {
  @IsUUID()
  parentPersonId!: string;

  @IsUUID()
  childPersonId!: string;

  @IsIn(PARENT_ROLES, { message: 'Vai trò cha/mẹ phải là FATHER hoặc MOTHER.' })
  parentRole!: string;

  @IsOptional()
  @IsIn(PARENT_RELATION_TYPES)
  relationType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  displayOrder?: number;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  note?: string;
}

export class CreateMarriageDto {
  @IsUUID()
  husbandPersonId!: string;

  @IsUUID()
  wifePersonId!: string;

  @IsOptional()
  @IsIn(MARRIAGE_STATUSES)
  status?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(DATE_PATTERN, { message: 'Ngày cưới phải có dạng YYYY-MM-DD.' })
  marriedSolarDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(DATE_PATTERN, { message: 'Ngày kết thúc phải có dạng YYYY-MM-DD.' })
  endedSolarDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  note?: string;
}

export class UpdateMarriageDto {
  @IsOptional()
  @IsIn(MARRIAGE_STATUSES)
  status?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(DATE_PATTERN, { message: 'Ngày cưới phải có dạng YYYY-MM-DD.' })
  marriedSolarDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(DATE_PATTERN, { message: 'Ngày kết thúc phải có dạng YYYY-MM-DD.' })
  endedSolarDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  note?: string;
}

export class TransferLeadershipDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  successorPersonId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  reason?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  note?: string;
}
