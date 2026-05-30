import { IsBoolean, IsEmail, IsOptional, ValidateIf } from 'class-validator';

export class UpdateNotificationSettingDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== null)
  @IsEmail()
  email?: string;
}
