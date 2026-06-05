import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BranchRecord } from '../genealogy/genealogy.types';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { BranchScopeRepository } from './branch-scope.repository';
import {
  BranchScopedRoleRecord,
  CreateBranchScopedRoleInput,
  ResolvedBranchScope,
  UNRESTRICTED_ROLE_CODES,
} from './branch-scope.types';

/** Subset của RequestUser cần để tính phạm vi. */
export interface ScopeActor {
  id: string;
  roles: Array<{ code: string }>;
}

@Injectable()
export class BranchScopeService {
  constructor(
    private readonly repository: BranchScopeRepository,
    private readonly genealogyRepository: GenealogyRepository,
  ) {}

  listAll(): Promise<BranchScopedRoleRecord[]> {
    return this.repository.list();
  }

  listByUser(userId: string): Promise<BranchScopedRoleRecord[]> {
    return this.repository.listByUser(userId);
  }

  async assignScope(
    input: CreateBranchScopedRoleInput,
  ): Promise<BranchScopedRoleRecord> {
    const branch = await this.genealogyRepository.findBranch(input.branchId);
    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'Không tìm thấy chi/nhánh.',
      });
    }

    if (UNRESTRICTED_ROLE_CODES.includes(input.roleCode as never)) {
      throw new BadRequestException({
        code: 'ROLE_ALREADY_UNRESTRICTED',
        message: 'Vai trò này đã có phạm vi toàn họ, không cần gán theo chi.',
      });
    }

    if (await this.repository.exists(input)) {
      throw new ConflictException({
        code: 'SCOPE_ALREADY_ASSIGNED',
        message: 'Phạm vi chi này đã được gán cho người dùng.',
      });
    }

    return this.repository.create(input);
  }

  async removeScope(id: string): Promise<{ id: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: 'SCOPE_NOT_FOUND',
        message: 'Không tìm thấy phân quyền theo chi.',
      });
    }
    await this.repository.delete(id);
    return { id };
  }

  isUnrestricted(actor: ScopeActor): boolean {
    return actor.roles.some((role) =>
      UNRESTRICTED_ROLE_CODES.includes(role.code as never),
    );
  }

  /** Tính tập branch_id mà actor được phép thao tác (đã gồm chi con). */
  async resolveScope(actor: ScopeActor): Promise<ResolvedBranchScope> {
    if (this.isUnrestricted(actor)) {
      return { unrestricted: true, branchIds: new Set() };
    }

    const assignments = await this.repository.listByUser(actor.id);
    const directBranchIds = assignments.map((item) => item.branchId);

    if (directBranchIds.length === 0) {
      return { unrestricted: false, branchIds: new Set() };
    }

    const branches = await this.genealogyRepository.listBranches();
    return {
      unrestricted: false,
      branchIds: expandWithDescendants(directBranchIds, branches),
    };
  }

  async canActOnBranch(
    actor: ScopeActor,
    branchId: string | null | undefined,
  ): Promise<boolean> {
    const scope = await this.resolveScope(actor);
    if (scope.unrestricted) return true;
    if (!branchId) return false;
    return scope.branchIds.has(branchId);
  }

  /** Chặn thao tác ngoài phạm vi chi với 403 BRANCH_SCOPE_FORBIDDEN. */
  async assertCanActOnBranch(
    actor: ScopeActor,
    branchId: string | null | undefined,
  ): Promise<void> {
    if (await this.canActOnBranch(actor, branchId)) {
      return;
    }
    throw new ForbiddenException({
      code: 'BRANCH_SCOPE_FORBIDDEN',
      message: 'Bạn chỉ được thao tác trong chi/nhánh được phân công.',
    });
  }
}

/** Mở rộng danh sách chi để gồm toàn bộ chi con theo parent_branch_id. */
export function expandWithDescendants(
  branchIds: string[],
  branches: BranchRecord[],
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const branch of branches) {
    if (branch.parentBranchId) {
      const list = childrenByParent.get(branch.parentBranchId) ?? [];
      list.push(branch.id);
      childrenByParent.set(branch.parentBranchId, list);
    }
  }

  const result = new Set<string>();
  const stack = [...branchIds];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (result.has(current)) continue;
    result.add(current);
    for (const childId of childrenByParent.get(current) ?? []) {
      stack.push(childId);
    }
  }

  return result;
}
