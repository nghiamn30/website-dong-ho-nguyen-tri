import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  AlbumRecord,
  CategoryRecord,
  ContentStatus,
  ContentVisibility,
  MediaRecord,
  MediaType,
  PageContentRecord,
  PostRecord,
} from './content.types';

type PrismaCategory = Prisma.CategoryGetPayload<object>;
type PrismaPost = Prisma.PostGetPayload<object>;
type PrismaAlbum = Prisma.AlbumGetPayload<object>;
type PrismaMedia = Prisma.MediaGetPayload<object>;
type PrismaPage = Prisma.PageContentGetPayload<object>;

export interface SaveCategoryInput {
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  displayOrder?: number;
  active?: boolean;
}

export interface SavePostInput {
  clanId: string;
  branchId: string | null;
  categoryId: string | null;
  relatedEventId: string | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  visibilityScope: ContentVisibility;
  isPinned: boolean;
  status: ContentStatus;
  authorId: string | null;
  publishedAt: string | null;
}

export interface UpdatePostInput {
  branchId?: string | null;
  categoryId?: string | null;
  relatedEventId?: string | null;
  title?: string;
  slug?: string;
  summary?: string | null;
  content?: string | null;
  thumbnailUrl?: string | null;
  visibilityScope?: ContentVisibility;
  isPinned?: boolean;
  status?: ContentStatus;
  publishedAt?: string | null;
}

export interface SaveAlbumInput {
  clanId: string;
  branchId: string | null;
  relatedEventId: string | null;
  title: string;
  slug: string;
  description: string | null;
  coverMediaId: string | null;
  visibilityScope: ContentVisibility;
  status: ContentStatus;
  createdBy: string | null;
}

export interface UpdateAlbumInput {
  branchId?: string | null;
  relatedEventId?: string | null;
  title?: string;
  slug?: string;
  description?: string | null;
  coverMediaId?: string | null;
  visibilityScope?: ContentVisibility;
  status?: ContentStatus;
}

export interface SaveMediaInput {
  albumId: string | null;
  personId: string | null;
  eventId: string | null;
  fileType: MediaType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  caption: string | null;
  uploadedBy: string | null;
}

export interface UpdateMediaInput {
  albumId?: string | null;
  caption?: string | null;
}

export interface SavePageInput {
  key: string;
  title: string;
  content: string | null;
  updatedBy: string | null;
}

export interface ListPostsFilter {
  statuses?: ContentStatus[];
  visibilities?: ContentVisibility[];
  categoryId?: string;
  branchId?: string;
  search?: string;
}

export interface ListAlbumsFilter {
  statuses?: ContentStatus[];
  visibilities?: ContentVisibility[];
  branchId?: string;
}

@Injectable()
export class ContentRepository {
  private readonly memoryCategories: CategoryRecord[] = [];
  private readonly memoryPosts: PostRecord[] = [];
  private readonly memoryAlbums: AlbumRecord[] = [];
  private readonly memoryMedia: MediaRecord[] = [];
  private readonly memoryPages: PageContentRecord[] = [];

  constructor(@Optional() private readonly prismaService?: PrismaService) {}

  // ----- Categories -----

  async listCategories(
    filter: { activeOnly?: boolean } = {},
  ): Promise<CategoryRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.category.findMany({
        where: { active: filter.activeOnly ? true : undefined },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      return rows.map(toCategoryRecord);
    }
    return structuredClone(
      this.memoryCategories
        .filter((row) => (filter.activeOnly ? row.active : true))
        .sort(
          (a, b) =>
            a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
        ),
    );
  }

  async findCategory(id: string): Promise<CategoryRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.category.findUnique({ where: { id } });
      return row ? toCategoryRecord(row) : null;
    }
    return structuredClone(
      this.memoryCategories.find((row) => row.id === id) ?? null,
    );
  }

  async findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.category.findUnique({ where: { slug } });
      return row ? toCategoryRecord(row) : null;
    }
    return structuredClone(
      this.memoryCategories.find((row) => row.slug === slug) ?? null,
    );
  }

  async createCategory(input: SaveCategoryInput): Promise<CategoryRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.category.create({ data: input });
      return toCategoryRecord(row);
    }
    const now = new Date().toISOString();
    const row: CategoryRecord = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description ?? undefined,
      displayOrder: input.displayOrder,
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryCategories.push(row);
    return structuredClone(row);
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.category.update({ where: { id }, data: input });
      return toCategoryRecord(row);
    }
    const row = this.memoryCategories.find((item) => item.id === id);
    if (!row) {
      throw new Error(`Category ${id} not found.`);
    }
    applyOptional(row, 'name', input.name);
    applyOptional(row, 'slug', input.slug);
    applyOptional(row, 'description', input.description);
    applyOptional(row, 'displayOrder', input.displayOrder);
    applyOptional(row, 'active', input.active);
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async deleteCategory(id: string): Promise<void> {
    const prisma = this.getPrisma();
    if (prisma) {
      await prisma.category.delete({ where: { id } });
      return;
    }
    const index = this.memoryCategories.findIndex((row) => row.id === id);
    if (index >= 0) {
      this.memoryCategories.splice(index, 1);
    }
  }

  async countPostsInCategory(categoryId: string): Promise<number> {
    const prisma = this.getPrisma();
    if (prisma) {
      return prisma.post.count({ where: { categoryId } });
    }
    return this.memoryPosts.filter((row) => row.categoryId === categoryId)
      .length;
  }

  // ----- Posts -----

  async listPosts(filter: ListPostsFilter = {}): Promise<PostRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.post.findMany({
        where: {
          status: filter.statuses ? { in: filter.statuses } : undefined,
          visibilityScope: filter.visibilities
            ? { in: filter.visibilities }
            : undefined,
          categoryId: filter.categoryId,
          branchId: filter.branchId,
          title: filter.search
            ? { contains: filter.search, mode: 'insensitive' }
            : undefined,
        },
        orderBy: [
          { isPinned: 'desc' },
          { publishedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
      });
      return rows.map(toPostRecord);
    }
    const search = filter.search?.toLowerCase();
    return structuredClone(
      this.memoryPosts
        .filter((row) =>
          filter.statuses ? filter.statuses.includes(row.status) : true,
        )
        .filter((row) =>
          filter.visibilities
            ? filter.visibilities.includes(row.visibilityScope)
            : true,
        )
        .filter((row) =>
          filter.categoryId ? row.categoryId === filter.categoryId : true,
        )
        .filter((row) =>
          filter.branchId ? row.branchId === filter.branchId : true,
        )
        .filter((row) =>
          search ? row.title.toLowerCase().includes(search) : true,
        )
        .sort(sortPosts),
    );
  }

  async findPost(id: string): Promise<PostRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.post.findUnique({ where: { id } });
      return row ? toPostRecord(row) : null;
    }
    return structuredClone(
      this.memoryPosts.find((row) => row.id === id) ?? null,
    );
  }

  async findPostBySlug(slug: string): Promise<PostRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.post.findUnique({ where: { slug } });
      return row ? toPostRecord(row) : null;
    }
    return structuredClone(
      this.memoryPosts.find((row) => row.slug === slug) ?? null,
    );
  }

  async createPost(input: SavePostInput): Promise<PostRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.post.create({
        data: {
          clanId: input.clanId,
          branchId: input.branchId,
          categoryId: input.categoryId,
          relatedEventId: input.relatedEventId,
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          content: input.content,
          thumbnailUrl: input.thumbnailUrl,
          visibilityScope: input.visibilityScope,
          isPinned: input.isPinned,
          status: input.status,
          authorId: input.authorId,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        },
      });
      return toPostRecord(row);
    }
    const now = new Date().toISOString();
    const row: PostRecord = {
      id: randomUUID(),
      clanId: input.clanId,
      branchId: input.branchId ?? undefined,
      categoryId: input.categoryId ?? undefined,
      relatedEventId: input.relatedEventId ?? undefined,
      title: input.title,
      slug: input.slug,
      summary: input.summary ?? undefined,
      content: input.content ?? undefined,
      thumbnailUrl: input.thumbnailUrl ?? undefined,
      visibilityScope: input.visibilityScope,
      isPinned: input.isPinned,
      status: input.status,
      authorId: input.authorId ?? undefined,
      publishedAt: input.publishedAt ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryPosts.push(row);
    return structuredClone(row);
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<PostRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.post.update({
        where: { id },
        data: {
          branchId: input.branchId,
          categoryId: input.categoryId,
          relatedEventId: input.relatedEventId,
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          content: input.content,
          thumbnailUrl: input.thumbnailUrl,
          visibilityScope: input.visibilityScope,
          isPinned: input.isPinned,
          status: input.status,
          publishedAt:
            input.publishedAt === undefined
              ? undefined
              : input.publishedAt
                ? new Date(input.publishedAt)
                : null,
        },
      });
      return toPostRecord(row);
    }
    const row = this.memoryPosts.find((item) => item.id === id);
    if (!row) {
      throw new Error(`Post ${id} not found.`);
    }
    applyOptional(row, 'branchId', input.branchId);
    applyOptional(row, 'categoryId', input.categoryId);
    applyOptional(row, 'relatedEventId', input.relatedEventId);
    applyOptional(row, 'title', input.title);
    applyOptional(row, 'slug', input.slug);
    applyOptional(row, 'summary', input.summary);
    applyOptional(row, 'content', input.content);
    applyOptional(row, 'thumbnailUrl', input.thumbnailUrl);
    applyOptional(row, 'visibilityScope', input.visibilityScope);
    applyOptional(row, 'isPinned', input.isPinned);
    applyOptional(row, 'status', input.status);
    applyOptional(row, 'publishedAt', input.publishedAt);
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async deletePost(id: string): Promise<void> {
    const prisma = this.getPrisma();
    if (prisma) {
      await prisma.post.delete({ where: { id } });
      return;
    }
    const index = this.memoryPosts.findIndex((row) => row.id === id);
    if (index >= 0) {
      this.memoryPosts.splice(index, 1);
    }
  }

  // ----- Albums -----

  async listAlbums(filter: ListAlbumsFilter = {}): Promise<AlbumRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.album.findMany({
        where: {
          status: filter.statuses ? { in: filter.statuses } : undefined,
          visibilityScope: filter.visibilities
            ? { in: filter.visibilities }
            : undefined,
          branchId: filter.branchId,
        },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(toAlbumRecord);
    }
    return structuredClone(
      this.memoryAlbums
        .filter((row) =>
          filter.statuses ? filter.statuses.includes(row.status) : true,
        )
        .filter((row) =>
          filter.visibilities
            ? filter.visibilities.includes(row.visibilityScope)
            : true,
        )
        .filter((row) =>
          filter.branchId ? row.branchId === filter.branchId : true,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async findAlbum(id: string): Promise<AlbumRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.album.findUnique({ where: { id } });
      return row ? toAlbumRecord(row) : null;
    }
    return structuredClone(
      this.memoryAlbums.find((row) => row.id === id) ?? null,
    );
  }

  async findAlbumBySlug(slug: string): Promise<AlbumRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.album.findUnique({ where: { slug } });
      return row ? toAlbumRecord(row) : null;
    }
    return structuredClone(
      this.memoryAlbums.find((row) => row.slug === slug) ?? null,
    );
  }

  async createAlbum(input: SaveAlbumInput): Promise<AlbumRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.album.create({ data: input });
      return toAlbumRecord(row);
    }
    const now = new Date().toISOString();
    const row: AlbumRecord = {
      id: randomUUID(),
      clanId: input.clanId,
      branchId: input.branchId ?? undefined,
      relatedEventId: input.relatedEventId ?? undefined,
      title: input.title,
      slug: input.slug,
      description: input.description ?? undefined,
      coverMediaId: input.coverMediaId ?? undefined,
      visibilityScope: input.visibilityScope,
      status: input.status,
      createdBy: input.createdBy ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryAlbums.push(row);
    return structuredClone(row);
  }

  async updateAlbum(id: string, input: UpdateAlbumInput): Promise<AlbumRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.album.update({ where: { id }, data: input });
      return toAlbumRecord(row);
    }
    const row = this.memoryAlbums.find((item) => item.id === id);
    if (!row) {
      throw new Error(`Album ${id} not found.`);
    }
    applyOptional(row, 'branchId', input.branchId);
    applyOptional(row, 'relatedEventId', input.relatedEventId);
    applyOptional(row, 'title', input.title);
    applyOptional(row, 'slug', input.slug);
    applyOptional(row, 'description', input.description);
    applyOptional(row, 'coverMediaId', input.coverMediaId);
    applyOptional(row, 'visibilityScope', input.visibilityScope);
    applyOptional(row, 'status', input.status);
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async deleteAlbum(id: string): Promise<void> {
    const prisma = this.getPrisma();
    if (prisma) {
      await prisma.album.delete({ where: { id } });
      return;
    }
    const index = this.memoryAlbums.findIndex((row) => row.id === id);
    if (index >= 0) {
      this.memoryAlbums.splice(index, 1);
    }
  }

  // ----- Media -----

  async listMedia(
    filter: { albumId?: string | null; includeDeleted?: boolean } = {},
  ): Promise<MediaRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.media.findMany({
        where: {
          albumId: filter.albumId === undefined ? undefined : filter.albumId,
          deletedAt: filter.includeDeleted ? undefined : null,
        },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(toMediaRecord);
    }
    return structuredClone(
      this.memoryMedia
        .filter((row) =>
          filter.albumId === undefined
            ? true
            : (row.albumId ?? null) === filter.albumId,
        )
        .filter((row) => (filter.includeDeleted ? true : !row.deletedAt))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  }

  async findMedia(id: string): Promise<MediaRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.media.findUnique({ where: { id } });
      return row ? toMediaRecord(row) : null;
    }
    return structuredClone(
      this.memoryMedia.find((row) => row.id === id) ?? null,
    );
  }

  async createMedia(input: SaveMediaInput): Promise<MediaRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.media.create({ data: input });
      return toMediaRecord(row);
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const row: MediaRecord = {
      id,
      albumId: input.albumId ?? undefined,
      personId: input.personId ?? undefined,
      eventId: input.eventId ?? undefined,
      fileType: input.fileType,
      fileUrl: input.fileUrl,
      url: mediaUrl(id),
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      caption: input.caption ?? undefined,
      uploadedBy: input.uploadedBy ?? undefined,
      deletedAt: undefined,
      createdAt: now,
    };
    this.memoryMedia.push(row);
    return structuredClone(row);
  }

  async updateMedia(id: string, input: UpdateMediaInput): Promise<MediaRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.media.update({
        where: { id },
        data: { albumId: input.albumId, caption: input.caption },
      });
      return toMediaRecord(row);
    }
    const row = this.memoryMedia.find((item) => item.id === id);
    if (!row) {
      throw new Error(`Media ${id} not found.`);
    }
    applyOptional(row, 'albumId', input.albumId);
    applyOptional(row, 'caption', input.caption);
    return structuredClone(row);
  }

  async softDeleteMedia(id: string): Promise<MediaRecord> {
    const prisma = this.getPrisma();
    const deletedAt = new Date();
    if (prisma) {
      const row = await prisma.media.update({
        where: { id },
        data: { deletedAt },
      });
      return toMediaRecord(row);
    }
    const row = this.memoryMedia.find((item) => item.id === id);
    if (!row) {
      throw new Error(`Media ${id} not found.`);
    }
    row.deletedAt = deletedAt.toISOString();
    return structuredClone(row);
  }

  async countMediaInAlbum(
    albumId: string,
    includeDeleted = false,
  ): Promise<number> {
    const prisma = this.getPrisma();
    if (prisma) {
      return prisma.media.count({
        where: { albumId, deletedAt: includeDeleted ? undefined : null },
      });
    }
    return this.memoryMedia.filter(
      (row) => row.albumId === albumId && (includeDeleted || !row.deletedAt),
    ).length;
  }

  // ----- Page content -----

  async listPages(): Promise<PageContentRecord[]> {
    const prisma = this.getPrisma();
    if (prisma) {
      const rows = await prisma.pageContent.findMany({
        orderBy: { key: 'asc' },
      });
      return rows.map(toPageRecord);
    }
    return structuredClone(
      [...this.memoryPages].sort((a, b) => a.key.localeCompare(b.key)),
    );
  }

  async findPage(key: string): Promise<PageContentRecord | null> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.pageContent.findUnique({ where: { key } });
      return row ? toPageRecord(row) : null;
    }
    return structuredClone(
      this.memoryPages.find((row) => row.key === key) ?? null,
    );
  }

  async upsertPage(input: SavePageInput): Promise<PageContentRecord> {
    const prisma = this.getPrisma();
    if (prisma) {
      const row = await prisma.pageContent.upsert({
        where: { key: input.key },
        update: {
          title: input.title,
          content: input.content,
          updatedBy: input.updatedBy,
        },
        create: {
          key: input.key,
          title: input.title,
          content: input.content,
          updatedBy: input.updatedBy,
        },
      });
      return toPageRecord(row);
    }
    const existing = this.memoryPages.find((row) => row.key === input.key);
    const now = new Date().toISOString();
    if (existing) {
      existing.title = input.title;
      existing.content = input.content ?? undefined;
      existing.updatedBy = input.updatedBy ?? undefined;
      existing.updatedAt = now;
      return structuredClone(existing);
    }
    const row: PageContentRecord = {
      id: randomUUID(),
      key: input.key,
      title: input.title,
      content: input.content ?? undefined,
      updatedBy: input.updatedBy ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryPages.push(row);
    return structuredClone(row);
  }

  private getPrisma() {
    return this.prismaService?.isEnabled() ? this.prismaService : undefined;
  }
}

function mediaUrl(id: string): string {
  return `/portal/media/${id}/raw`;
}

function sortPosts(a: PostRecord, b: PostRecord): number {
  if (a.isPinned !== b.isPinned) {
    return a.isPinned ? -1 : 1;
  }
  const aDate = a.publishedAt ?? a.createdAt;
  const bDate = b.publishedAt ?? b.createdAt;
  return bDate.localeCompare(aDate);
}

function applyOptional<T, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | null | undefined,
) {
  if (value === undefined) {
    return;
  }
  target[key] = (value === null ? undefined : value) as T[K];
}

function toCategoryRecord(row: PrismaCategory): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    displayOrder: row.displayOrder,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPostRecord(row: PrismaPost): PostRecord {
  return {
    id: row.id,
    clanId: row.clanId,
    branchId: row.branchId ?? undefined,
    categoryId: row.categoryId ?? undefined,
    relatedEventId: row.relatedEventId ?? undefined,
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? undefined,
    content: row.content ?? undefined,
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    visibilityScope: row.visibilityScope,
    isPinned: row.isPinned,
    status: row.status,
    authorId: row.authorId ?? undefined,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAlbumRecord(row: PrismaAlbum): AlbumRecord {
  return {
    id: row.id,
    clanId: row.clanId,
    branchId: row.branchId ?? undefined,
    relatedEventId: row.relatedEventId ?? undefined,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    coverMediaId: row.coverMediaId ?? undefined,
    visibilityScope: row.visibilityScope,
    status: row.status,
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMediaRecord(row: PrismaMedia): MediaRecord {
  return {
    id: row.id,
    albumId: row.albumId ?? undefined,
    personId: row.personId ?? undefined,
    eventId: row.eventId ?? undefined,
    fileType: row.fileType,
    fileUrl: row.fileUrl,
    url: mediaUrl(row.id),
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    caption: row.caption ?? undefined,
    uploadedBy: row.uploadedBy ?? undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toPageRecord(row: PrismaPage): PageContentRecord {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    content: row.content ?? undefined,
    updatedBy: row.updatedBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
