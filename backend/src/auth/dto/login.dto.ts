import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2)
  employeeCode!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
