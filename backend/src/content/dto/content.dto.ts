import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CONTENT_STATUSES, CONTENT_VISIBILITIES } from '../content.types';

function emptyToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ----- Categories -----

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(SLUG_PATTERN, {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
  })
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(SLUG_PATTERN, {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
  })
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ----- Posts -----

export class CreatePostDto {
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(SLUG_PATTERN, {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
  })
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(2048)
  thumbnailUrl?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsIn(CONTENT_VISIBILITIES)
  visibilityScope?: (typeof CONTENT_VISIBILITIES)[number];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: (typeof CONTENT_STATUSES)[number];
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(SLUG_PATTERN, {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
  })
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(2048)
  thumbnailUrl?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsIn(CONTENT_VISIBILITIES)
  visibilityScope?: (typeof CONTENT_VISIBILITIES)[number];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: (typeof CONTENT_STATUSES)[number];
}

// ----- Albums -----

export class CreateAlbumDto {
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(SLUG_PATTERN, {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
  })
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsIn(CONTENT_VISIBILITIES)
  visibilityScope?: (typeof CONTENT_VISIBILITIES)[number];

  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: (typeof CONTENT_STATUSES)[number];
}

export class UpdateAlbumDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(SLUG_PATTERN, {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
  })
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  coverMediaId?: string;

  @IsOptional()
  @IsIn(CONTENT_VISIBILITIES)
  visibilityScope?: (typeof CONTENT_VISIBILITIES)[number];

  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: (typeof CONTENT_STATUSES)[number];
}

// ----- Media -----

export class UploadMediaDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  albumId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  personId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(500)
  caption?: string;
}

export class UpdateMediaDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  albumId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(500)
  caption?: string;
}

// ----- Page content -----

export class UpdatePageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  content?: string;
}
