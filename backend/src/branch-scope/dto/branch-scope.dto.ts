import { IsIn, IsString, IsUUID } from 'class-validator';
import { ROLE_CODES } from '../../users/user.types';

// Chỉ các vai trò bị giới hạn theo chi mới gán được phạm vi.
const scopedRoleCodes = [ROLE_CODES.TRUONG_CHI, ROLE_CODES.NGUOI_BINH_THUONG];

export class AssignBranchScopeDto {
  @IsString()
  @IsUUID()
  userId!: string;

  @IsString()
  @IsIn(scopedRoleCodes)
  roleCode!: string;

  @IsString()
  @IsUUID()
  branchId!: string;
}
