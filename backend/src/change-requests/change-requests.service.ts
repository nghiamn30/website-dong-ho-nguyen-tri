import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreatePersonDto,
  UpdatePersonDto,
} from '../genealogy/dto/genealogy.dto';
import { GenealogyService } from '../genealogy/genealogy.service';
import { ChangeRequestsRepository } from './change-requests.repository';
import {
  ChangeRequestEntityType,
  ChangeRequestFilter,
  ChangeRequestRecord,
  ChangeRequestType,
  CreateChangeRequestInput,
} from './change-requests.types';

export interface ApplyResult {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

@Injectable()
export class ChangeRequestsService {
  constructor(
    private readonly repository: ChangeRequestsRepository,
    private readonly genealogyService: GenealogyService,
  ) {}

  list(filter?: ChangeRequestFilter): Promise<ChangeRequestRecord[]> {
    return this.repository.list(filter);
  }

  async getById(id: string): Promise<ChangeRequestRecord> {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundException({
        code: 'CHANGE_REQUEST_NOT_FOUND',
        message: 'Không tìm thấy đề xuất chỉnh sửa.',
      });
    }
    return request;
  }

  async create(input: CreateChangeRequestInput): Promise<ChangeRequestRecord> {
    // UPDATE/DELETE phải tham chiếu một thực thể đang tồn tại; CREATE thì không.
    if (input.requestType === 'CREATE') {
      if (input.entityId) {
        throw new BadRequestException({
          code: 'CREATE_REQUEST_HAS_ENTITY',
          message: 'Đề xuất tạo mới không được gắn entityId.',
        });
      }
    } else {
      if (!input.entityId) {
        throw new BadRequestException({
          code: 'ENTITY_ID_REQUIRED',
          message: 'Đề xuất sửa/xoá cần entityId của thực thể.',
        });
      }
      // Xác nhận thực thể tồn tại tại thời điểm gửi đề xuất.
      await this.loadEntity(input.entityType, input.entityId);
    }

    return this.repository.create(input);
  }

  /**
   * Duyệt đề xuất: áp dụng thay đổi vào dữ liệu chính thức rồi đổi trạng thái.
   * Áp dụng theo thứ tự "apply trước, đổi status sau" để nếu apply lỗi thì
   * đề xuất vẫn ở trạng thái PENDING (không có thay đổi nửa vời). Với
   * PostgreSQL mỗi thao tác ghi của repository là atomic; với in-memory thao
   * tác chạy tuần tự trong cùng tiến trình.
   */
  async approve(
    id: string,
    reviewerId: string,
    reviewNote: string | undefined,
  ): Promise<{ request: ChangeRequestRecord; applied: ApplyResult }> {
    const request = await this.requirePending(id);
    const applied = await this.applyApprovedChange(request);
    const updated = await this.repository.review(id, {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewNote,
      reviewedAt: new Date().toISOString(),
    });
    return { request: updated, applied };
  }

  async reject(
    id: string,
    reviewerId: string,
    reviewNote: string | undefined,
  ): Promise<ChangeRequestRecord> {
    await this.requirePending(id);
    // Từ chối KHÔNG thay đổi dữ liệu chính thức.
    return this.repository.review(id, {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewNote,
      reviewedAt: new Date().toISOString(),
    });
  }

  private async requirePending(id: string): Promise<ChangeRequestRecord> {
    const request = await this.getById(id);
    if (request.status !== 'PENDING') {
      throw new ConflictException({
        code: 'CHANGE_REQUEST_NOT_PENDING',
        message: 'Đề xuất đã được xử lý trước đó.',
      });
    }
    return request;
  }

  private async applyApprovedChange(
    request: ChangeRequestRecord,
  ): Promise<ApplyResult> {
    if (request.entityType !== 'person') {
      throw new BadRequestException({
        code: 'UNSUPPORTED_ENTITY_TYPE',
        message: `Chưa hỗ trợ duyệt thực thể "${request.entityType}".`,
      });
    }

    switch (request.requestType) {
      case 'CREATE': {
        const created = await this.genealogyService.createPerson(
          request.proposedData as unknown as CreatePersonDto,
        );
        return { after: created as unknown as Record<string, unknown> };
      }
      case 'UPDATE': {
        const before = await this.genealogyService.getPerson(request.entityId!);
        const after = await this.genealogyService.updatePerson(
          request.entityId!,
          request.proposedData as unknown as UpdatePersonDto,
        );
        return {
          before: before as unknown as Record<string, unknown>,
          after: after as unknown as Record<string, unknown>,
        };
      }
      case 'DELETE': {
        const before = await this.genealogyService.getPerson(request.entityId!);
        await this.genealogyService.deletePerson(request.entityId!);
        return { before: before as unknown as Record<string, unknown> };
      }
      default:
        throw new BadRequestException({
          code: 'UNSUPPORTED_REQUEST_TYPE',
          message: 'Loại đề xuất không hợp lệ.',
        });
    }
  }

  private async loadEntity(
    entityType: ChangeRequestEntityType,
    entityId: string,
  ) {
    if (entityType === 'person') {
      // Ném NotFound nếu không tồn tại.
      return this.genealogyService.getPerson(entityId);
    }
    throw new BadRequestException({
      code: 'UNSUPPORTED_ENTITY_TYPE',
      message: `Chưa hỗ trợ đề xuất cho thực thể "${String(entityType)}".`,
    });
  }
}

export type { ChangeRequestType };
