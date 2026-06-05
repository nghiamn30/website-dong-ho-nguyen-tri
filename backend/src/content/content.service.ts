import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CalendarRepository } from '../calendar/calendar.repository';
import { EventRecord } from '../calendar/calendar.types';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { BranchRecord } from '../genealogy/genealogy.types';
import { PERMISSIONS } from '../users/user.types';
import {
  ContentRepository,
  ListAlbumsFilter,
  ListPostsFilter,
} from './content.repository';
import {
  AlbumRecord,
  AlbumSummary,
  CategoryRecord,
  ContentStatus,
  MediaRecord,
  MediaType,
  PageContentRecord,
  PostRecord,
} from './content.types';
import {
  CreateAlbumDto,
  CreateCategoryDto,
  CreatePostDto,
  UpdateAlbumDto,
  UpdateCategoryDto,
  UpdateMediaDto,
  UpdatePageDto,
  UpdatePostDto,
  UploadMediaDto,
} from './dto/content.dto';
import { StorageService } from './storage.service';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_DOCUMENT_MIME = new Set(['application/pdf']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class ContentService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly genealogy: GenealogyRepository,
    private readonly calendar: CalendarRepository,
    private readonly storage: StorageService,
  ) {}

  // ===================================================================
  // Categories
  // ===================================================================

  listCategories(activeOnly = false): Promise<CategoryRecord[]> {
    return this.repository.listCategories({ activeOnly });
  }

  async getCategory(id: string): Promise<CategoryRecord> {
    const category = await this.repository.findCategory(id);
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Không tìm thấy chuyên mục.',
      });
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto): Promise<CategoryRecord> {
    const slug = await this.resolveUniqueSlug(
      dto.slug ?? dto.name,
      (candidate) => this.repository.findCategoryBySlug(candidate),
    );
    return this.repository.createCategory({
      name: dto.name.trim(),
      slug,
      description: normalizeText(dto.description),
      displayOrder: dto.displayOrder ?? 0,
      active: dto.active ?? true,
    });
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryRecord> {
    const existing = await this.getCategory(id);
    const slug = dto.slug
      ? await this.resolveUniqueSlug(
          dto.slug,
          (candidate) => this.repository.findCategoryBySlug(candidate),
          existing.id,
        )
      : undefined;
    return this.repository.updateCategory(id, {
      name: dto.name?.trim(),
      slug,
      description:
        dto.description !== undefined
          ? normalizeText(dto.description)
          : undefined,
      displayOrder: dto.displayOrder,
      active: dto.active,
    });
  }

  async deleteCategory(id: string): Promise<{ id: string }> {
    await this.getCategory(id);
    const inUse = await this.repository.countPostsInCategory(id);
    if (inUse > 0) {
      throw new ConflictException({
        code: 'CATEGORY_IN_USE',
        message: `Không thể xóa chuyên mục đang gắn với ${inUse} bài viết.`,
      });
    }
    await this.repository.deleteCategory(id);
    return { id };
  }

  // ===================================================================
  // Posts
  // ===================================================================

  listPosts(filter: ListPostsFilter = {}): Promise<PostRecord[]> {
    return this.repository.listPosts(filter);
  }

  async getPost(id: string): Promise<PostRecord> {
    const post = await this.repository.findPost(id);
    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Không tìm thấy bài viết.',
      });
    }
    return post;
  }

  async createPost(
    dto: CreatePostDto,
    actor: RequestUser,
  ): Promise<PostRecord> {
    const clan = await this.resolveClan();
    const branchId = dto.branchId ?? null;
    if (branchId) {
      await this.findBranchOrThrow(branchId);
    }
    await this.assertCanManageBranchScope(actor, branchId);
    await this.assertCategory(dto.categoryId);
    await this.assertEvent(dto.relatedEventId);

    const slug = await this.resolveUniqueSlug(
      dto.slug ?? dto.title,
      (candidate) => this.repository.findPostBySlug(candidate),
    );

    const requestedStatus: ContentStatus = dto.status ?? 'DRAFT';
    const status = this.resolvePublishStatus(actor, requestedStatus);

    return this.repository.createPost({
      clanId: clan.id,
      branchId,
      categoryId: dto.categoryId ?? null,
      relatedEventId: dto.relatedEventId ?? null,
      title: dto.title.trim(),
      slug,
      summary: normalizeText(dto.summary),
      content: normalizeText(dto.content),
      thumbnailUrl: normalizeText(dto.thumbnailUrl),
      visibilityScope: dto.visibilityScope ?? 'PUBLIC',
      isPinned: dto.isPinned ?? false,
      status,
      authorId: actor.id,
      publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
    });
  }

  async updatePost(
    id: string,
    dto: UpdatePostDto,
    actor: RequestUser,
  ): Promise<PostRecord> {
    const existing = await this.getPost(id);

    const branchId =
      dto.branchId !== undefined
        ? (dto.branchId ?? null)
        : (existing.branchId ?? null);
    if (branchId) {
      await this.findBranchOrThrow(branchId);
    }
    // Authorize against both the previous and the next branch scope.
    await this.assertCanManageBranchScope(actor, existing.branchId ?? null);
    await this.assertCanManageBranchScope(actor, branchId);

    if (dto.categoryId !== undefined) {
      await this.assertCategory(dto.categoryId);
    }
    if (dto.relatedEventId !== undefined) {
      await this.assertEvent(dto.relatedEventId);
    }

    const slug = dto.slug
      ? await this.resolveUniqueSlug(
          dto.slug,
          (candidate) => this.repository.findPostBySlug(candidate),
          existing.id,
        )
      : undefined;

    let status = existing.status;
    let publishedAt: string | null | undefined;
    if (dto.status !== undefined && dto.status !== existing.status) {
      status = this.resolvePublishStatus(actor, dto.status);
      if (status === 'PUBLISHED' && !existing.publishedAt) {
        publishedAt = new Date().toISOString();
      } else if (status !== 'PUBLISHED') {
        publishedAt = null;
      }
    }

    return this.repository.updatePost(id, {
      branchId: dto.branchId !== undefined ? branchId : undefined,
      categoryId:
        dto.categoryId !== undefined ? (dto.categoryId ?? null) : undefined,
      relatedEventId:
        dto.relatedEventId !== undefined
          ? (dto.relatedEventId ?? null)
          : undefined,
      title: dto.title?.trim(),
      slug,
      summary:
        dto.summary !== undefined ? normalizeText(dto.summary) : undefined,
      content:
        dto.content !== undefined ? normalizeText(dto.content) : undefined,
      thumbnailUrl:
        dto.thumbnailUrl !== undefined
          ? normalizeText(dto.thumbnailUrl)
          : undefined,
      visibilityScope: dto.visibilityScope,
      isPinned: dto.isPinned,
      status: dto.status !== undefined ? status : undefined,
      publishedAt,
    });
  }

  /** Publish / hide / unhide shortcut used by the admin UI. */
  async setPostStatus(
    id: string,
    status: ContentStatus,
    actor: RequestUser,
  ): Promise<PostRecord> {
    return this.updatePost(id, { status }, actor);
  }

  async setPostPinned(
    id: string,
    isPinned: boolean,
    actor: RequestUser,
  ): Promise<PostRecord> {
    const existing = await this.getPost(id);
    await this.assertCanManageBranchScope(actor, existing.branchId ?? null);
    return this.repository.updatePost(id, { isPinned });
  }

  async deletePost(id: string, actor: RequestUser): Promise<{ id: string }> {
    const existing = await this.getPost(id);
    await this.assertCanManageBranchScope(actor, existing.branchId ?? null);
    await this.repository.deletePost(id);
    return { id };
  }

  // ===================================================================
  // Albums
  // ===================================================================

  listAlbums(filter: ListAlbumsFilter = {}): Promise<AlbumRecord[]> {
    return this.repository.listAlbums(filter);
  }

  async getAlbum(id: string): Promise<AlbumRecord> {
    const album = await this.repository.findAlbum(id);
    if (!album) {
      throw new NotFoundException({
        code: 'ALBUM_NOT_FOUND',
        message: 'Không tìm thấy album.',
      });
    }
    return album;
  }

  async getAlbumWithMedia(
    id: string,
  ): Promise<{ album: AlbumRecord; media: MediaRecord[] }> {
    const album = await this.getAlbum(id);
    const media = await this.repository.listMedia({ albumId: id });
    return { album, media };
  }

  async createAlbum(
    dto: CreateAlbumDto,
    actor: RequestUser,
  ): Promise<AlbumRecord> {
    const clan = await this.resolveClan();
    const branchId = dto.branchId ?? null;
    if (branchId) {
      await this.findBranchOrThrow(branchId);
    }
    await this.assertCanManageBranchScope(actor, branchId);
    await this.assertEvent(dto.relatedEventId);

    const slug = await this.resolveUniqueSlug(
      dto.slug ?? dto.title,
      (candidate) => this.repository.findAlbumBySlug(candidate),
    );

    return this.repository.createAlbum({
      clanId: clan.id,
      branchId,
      relatedEventId: dto.relatedEventId ?? null,
      title: dto.title.trim(),
      slug,
      description: normalizeText(dto.description),
      coverMediaId: null,
      visibilityScope: dto.visibilityScope ?? 'PUBLIC',
      status: dto.status ?? 'DRAFT',
      createdBy: actor.id,
    });
  }

  async updateAlbum(
    id: string,
    dto: UpdateAlbumDto,
    actor: RequestUser,
  ): Promise<AlbumRecord> {
    const existing = await this.getAlbum(id);
    const branchId =
      dto.branchId !== undefined
        ? (dto.branchId ?? null)
        : (existing.branchId ?? null);
    if (branchId) {
      await this.findBranchOrThrow(branchId);
    }
    await this.assertCanManageBranchScope(actor, existing.branchId ?? null);
    await this.assertCanManageBranchScope(actor, branchId);
    if (dto.relatedEventId !== undefined) {
      await this.assertEvent(dto.relatedEventId);
    }

    if (dto.coverMediaId) {
      await this.assertCoverBelongsToAlbum(dto.coverMediaId, id);
    }

    const slug = dto.slug
      ? await this.resolveUniqueSlug(
          dto.slug,
          (candidate) => this.repository.findAlbumBySlug(candidate),
          existing.id,
        )
      : undefined;

    return this.repository.updateAlbum(id, {
      branchId: dto.branchId !== undefined ? branchId : undefined,
      relatedEventId:
        dto.relatedEventId !== undefined
          ? (dto.relatedEventId ?? null)
          : undefined,
      title: dto.title?.trim(),
      slug,
      description:
        dto.description !== undefined
          ? normalizeText(dto.description)
          : undefined,
      coverMediaId: dto.coverMediaId,
      visibilityScope: dto.visibilityScope,
      status: dto.status,
    });
  }

  async deleteAlbum(id: string, actor: RequestUser): Promise<{ id: string }> {
    const existing = await this.getAlbum(id);
    await this.assertCanManageBranchScope(actor, existing.branchId ?? null);
    await this.repository.deleteAlbum(id);
    return { id };
  }

  // ===================================================================
  // Media
  // ===================================================================

  listMedia(albumId?: string): Promise<MediaRecord[]> {
    return this.repository.listMedia({ albumId: albumId ?? undefined });
  }

  async getMedia(id: string): Promise<MediaRecord> {
    const media = await this.repository.findMedia(id);
    if (!media || media.deletedAt) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Không tìm thấy tệp tin.',
      });
    }
    return media;
  }

  async readMediaFile(
    id: string,
  ): Promise<{ media: MediaRecord; buffer: Buffer }> {
    const media = await this.getMedia(id);
    const buffer = await this.storage.read(media.fileUrl);
    return { media, buffer };
  }

  async uploadMedia(
    file: UploadedFile | undefined,
    dto: UploadMediaDto,
    actor: RequestUser,
  ): Promise<MediaRecord> {
    if (!file) {
      throw new BadRequestException({
        code: 'FILE_REQUIRED',
        message: 'Cần chọn tệp tin để tải lên.',
      });
    }

    const fileType = this.resolveAndValidateFileType(file);

    if (dto.albumId) {
      await this.getAlbum(dto.albumId);
    }

    const stored = await this.storage.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return this.repository.createMedia({
      albumId: dto.albumId ?? null,
      personId: dto.personId ?? null,
      eventId: dto.eventId ?? null,
      fileType,
      fileUrl: stored.storageKey,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      caption: normalizeText(dto.caption),
      uploadedBy: actor.id,
    });
  }

  async updateMedia(id: string, dto: UpdateMediaDto): Promise<MediaRecord> {
    await this.getMedia(id);
    if (dto.albumId) {
      await this.getAlbum(dto.albumId);
    }
    return this.repository.updateMedia(id, {
      albumId: dto.albumId,
      caption:
        dto.caption !== undefined ? normalizeText(dto.caption) : undefined,
    });
  }

  async deleteMedia(id: string): Promise<{ id: string }> {
    const media = await this.getMedia(id);
    await this.repository.softDeleteMedia(id);
    // Free disk space; metadata is retained as a soft-deleted row.
    await this.storage.remove(media.fileUrl);
    return { id };
  }

  // ===================================================================
  // Page content
  // ===================================================================

  listPages(): Promise<PageContentRecord[]> {
    return this.repository.listPages();
  }

  async getPage(key: string): Promise<PageContentRecord | null> {
    return this.repository.findPage(key);
  }

  updatePage(
    key: string,
    dto: UpdatePageDto,
    actor: RequestUser,
  ): Promise<PageContentRecord> {
    return this.repository.upsertPage({
      key,
      title: dto.title.trim(),
      content: normalizeText(dto.content),
      updatedBy: actor.id,
    });
  }

  // ===================================================================
  // Public portal reads (PUBLIC + PUBLISHED only)
  // ===================================================================

  listPublicPosts(categoryId?: string): Promise<PostRecord[]> {
    return this.repository.listPosts({
      statuses: ['PUBLISHED'],
      visibilities: ['PUBLIC'],
      categoryId,
    });
  }

  async getPublicPost(slug: string): Promise<PostRecord> {
    const post = await this.repository.findPostBySlug(slug);
    if (
      !post ||
      post.status !== 'PUBLISHED' ||
      post.visibilityScope !== 'PUBLIC'
    ) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Không tìm thấy bài viết.',
      });
    }
    return post;
  }

  listPublicAlbums(): Promise<AlbumRecord[]> {
    return this.repository.listAlbums({
      statuses: ['PUBLISHED'],
      visibilities: ['PUBLIC'],
    });
  }

  /** Public albums enriched with a cover image URL and media count. */
  async listPublicAlbumSummaries(): Promise<AlbumSummary[]> {
    const albums = await this.listPublicAlbums();
    return Promise.all(albums.map((album) => this.toAlbumSummary(album)));
  }

  private async toAlbumSummary(album: AlbumRecord): Promise<AlbumSummary> {
    const media = await this.repository.listMedia({ albumId: album.id });
    const cover =
      media.find(
        (item) => album.coverMediaId && item.id === album.coverMediaId,
      ) ?? media.find((item) => item.fileType === 'IMAGE');
    return {
      ...album,
      coverUrl: cover?.url,
      mediaCount: media.length,
    };
  }

  async getPublicAlbum(
    id: string,
  ): Promise<{ album: AlbumRecord; media: MediaRecord[] }> {
    const album = await this.repository.findAlbum(id);
    if (
      !album ||
      album.status !== 'PUBLISHED' ||
      album.visibilityScope !== 'PUBLIC'
    ) {
      throw new NotFoundException({
        code: 'ALBUM_NOT_FOUND',
        message: 'Không tìm thấy album.',
      });
    }
    const media = await this.repository.listMedia({ albumId: id });
    return { album, media };
  }

  async getPortalHome() {
    const [clan, posts, albums, categories] = await Promise.all([
      this.genealogy.getClan().catch(() => null),
      this.listPublicPosts(),
      this.listPublicAlbumSummaries(),
      this.repository.listCategories({ activeOnly: true }),
    ]);

    const pinned = posts.filter((post) => post.isPinned).slice(0, 3);
    const latest = posts.filter((post) => !post.isPinned).slice(0, 6);
    const upcomingEvents = await this.getPublicUpcomingEvents();

    return {
      clan,
      pinnedPosts: pinned,
      latestPosts: latest,
      albums: albums.slice(0, 6),
      categories,
      upcomingEvents,
    };
  }

  private async getPublicUpcomingEvents(): Promise<EventRecord[]> {
    try {
      const now = new Date();
      const to = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const events = await this.calendar.listEvents({
        from: now.toISOString(),
        to: to.toISOString(),
      });
      return events
        .filter(
          (event) =>
            event.visibilityScope === 'CLAN' &&
            (event.status === 'PUBLISHED' || event.status === 'COMPLETED'),
        )
        .slice(0, 5);
    } catch {
      return [];
    }
  }

  // ===================================================================
  // Helpers
  // ===================================================================

  private resolveAndValidateFileType(file: UploadedFile): MediaType {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new BadRequestException({
          code: 'FILE_TOO_LARGE',
          message: 'Ảnh vượt quá dung lượng cho phép (tối đa 5MB).',
        });
      }
      return 'IMAGE';
    }
    if (ALLOWED_DOCUMENT_MIME.has(file.mimetype)) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        throw new BadRequestException({
          code: 'FILE_TOO_LARGE',
          message: 'Tài liệu vượt quá dung lượng cho phép (tối đa 10MB).',
        });
      }
      return 'DOCUMENT';
    }
    throw new BadRequestException({
      code: 'FILE_TYPE_NOT_ALLOWED',
      message: 'Chỉ chấp nhận ảnh (JPG, PNG, WEBP, GIF) hoặc tài liệu PDF.',
    });
  }

  private resolvePublishStatus(
    actor: RequestUser,
    requested: ContentStatus,
  ): ContentStatus {
    if (requested === 'PUBLISHED' && !this.canPublish(actor)) {
      // Without publish rights the post stays a draft.
      return 'DRAFT';
    }
    return requested;
  }

  private canPublish(actor: RequestUser): boolean {
    return actor.permissions.includes(PERMISSIONS.POSTS_PUBLISH);
  }

  private isClanManager(actor: RequestUser): boolean {
    return actor.permissions.includes(PERMISSIONS.CLAN_MANAGE);
  }

  private async assertCanManageBranchScope(
    actor: RequestUser,
    branchId: string | null,
  ) {
    if (this.isClanManager(actor)) {
      return;
    }
    if (!branchId) {
      throw new ForbiddenException({
        code: 'SCOPE_FORBIDDEN',
        message:
          'Trưởng chi chỉ quản lý nội dung gắn với chi/nhánh phụ trách, không tạo nội dung toàn họ.',
      });
    }
    const managed = await this.resolveManagedBranchIds(actor);
    if (!managed.has(branchId)) {
      throw new ForbiddenException({
        code: 'BRANCH_OUT_OF_SCOPE',
        message: 'Nội dung này nằm ngoài chi/nhánh bạn phụ trách.',
      });
    }
  }

  /** Branch ids a non-clan manager (trưởng chi) may manage, incl. sub-branches. */
  private async resolveManagedBranchIds(
    actor: RequestUser,
  ): Promise<Set<string>> {
    if (!actor.personId) {
      return new Set();
    }
    const branches = await this.genealogy.listBranches();
    const headed = branches
      .filter((branch) => branch.headPersonId === actor.personId)
      .map((branch) => branch.id);
    return this.collectBranchSubtree(branches, headed);
  }

  private collectBranchSubtree(
    branches: BranchRecord[],
    rootIds: string[],
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
    const stack = [...rootIds];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (result.has(current)) continue;
      result.add(current);
      for (const child of childrenByParent.get(current) ?? []) {
        stack.push(child);
      }
    }
    return result;
  }

  private async resolveUniqueSlug(
    source: string,
    lookup: (slug: string) => Promise<{ id: string } | null>,
    ignoreId?: string,
  ): Promise<string> {
    const base = slugify(source) || 'noi-dung';
    let candidate = base;
    let suffix = 2;
    // Bounded loop to avoid pathological collisions.
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const existing = await lookup(candidate);
      if (!existing || existing.id === ignoreId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    throw new ConflictException({
      code: 'SLUG_CONFLICT',
      message: 'Không tạo được slug duy nhất, vui lòng đổi tiêu đề.',
    });
  }

  private async assertCategory(categoryId?: string | null): Promise<void> {
    if (!categoryId) {
      return;
    }
    const category = await this.repository.findCategory(categoryId);
    if (!category) {
      throw new BadRequestException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Chuyên mục không tồn tại.',
      });
    }
  }

  private async assertEvent(eventId?: string | null): Promise<void> {
    if (!eventId) {
      return;
    }
    const event = await this.calendar.findEvent(eventId);
    if (!event) {
      throw new BadRequestException({
        code: 'EVENT_NOT_FOUND',
        message: 'Sự kiện liên kết không tồn tại.',
      });
    }
  }

  private async assertCoverBelongsToAlbum(
    mediaId: string,
    albumId: string,
  ): Promise<void> {
    const media = await this.repository.findMedia(mediaId);
    if (!media || media.deletedAt || media.albumId !== albumId) {
      throw new BadRequestException({
        code: 'COVER_INVALID',
        message: 'Ảnh đại diện phải thuộc về album này.',
      });
    }
  }

  private async resolveClan() {
    const existing = await this.genealogy.getClan();
    if (existing) {
      return existing;
    }
    // Bootstrap a default clan so the portal works before genealogy setup.
    return this.genealogy.upsertClan({ name: 'Dòng họ Nguyễn Trí' });
  }

  private async findBranchOrThrow(id: string): Promise<BranchRecord> {
    const branch = await this.genealogy.findBranch(id);
    if (!branch) {
      throw new NotFoundException({
        code: 'BRANCH_NOT_FOUND',
        message: 'Không tìm thấy chi/nhánh.',
      });
    }
    return branch;
  }
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

function normalizeText(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
