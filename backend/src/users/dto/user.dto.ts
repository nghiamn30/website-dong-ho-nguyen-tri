import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLE_CODES } from '../user.types';

const employeeCodeMessage =
  'Mã tài khoản chỉ được dùng chữ hoa, số và dấu gạch ngang.';
const roleCodes = Object.values(ROLE_CODES);

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Z0-9-]+$/, { message: employeeCodeMessage })
  employeeCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password!: string;

  @IsString()
  @IsIn(roleCodes)
  roleCode!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(roleCodes)
  roleCode?: string;
}

export class SetUserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password!: string;
}
