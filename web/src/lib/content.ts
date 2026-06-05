import { apiRequest, createApiUrl } from "@/lib/auth";
import type { EventRecord } from "@/lib/calendar";
import type { ClanRecord } from "@/lib/genealogy";

export type ContentStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
export type ContentVisibility = "PUBLIC" | "MEMBERS" | "BRANCH" | "LEADERSHIP";
export type MediaType = "IMAGE" | "DOCUMENT" | "OTHER";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostRecord {
  id: string;
  clanId: string;
  branchId?: string;
  categoryId?: string;
  relatedEventId?: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string;
  visibilityScope: ContentVisibility;
  isPinned: boolean;
  status: ContentStatus;
  authorId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumRecord {
  id: string;
  clanId: string;
  branchId?: string;
  relatedEventId?: string;
  title: string;
  slug: string;
  description?: string;
  coverMediaId?: string;
  visibilityScope: ContentVisibility;
  status: ContentStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaRecord {
  id: string;
  albumId?: string;
  personId?: string;
  eventId?: string;
  fileType: MediaType;
  fileUrl: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  caption?: string;
  uploadedBy?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface PageContentRecord {
  id: string;
  key: string;
  title: string;
  content?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumWithMedia {
  album: AlbumRecord;
  media: MediaRecord[];
}

export interface AlbumSummary extends AlbumRecord {
  coverUrl?: string;
  mediaCount: number;
}

export interface PortalHome {
  clan: ClanRecord | null;
  pinnedPosts: PostRecord[];
  latestPosts: PostRecord[];
  albums: AlbumSummary[];
  categories: CategoryRecord[];
  upcomingEvents: EventRecord[];
}

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface PostPayload {
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string;
  categoryId?: string;
  branchId?: string;
  relatedEventId?: string;
  visibilityScope?: ContentVisibility;
  isPinned?: boolean;
  status?: ContentStatus;
}

export interface AlbumPayload {
  title: string;
  slug?: string;
  description?: string;
  branchId?: string;
  relatedEventId?: string;
  coverMediaId?: string;
  visibilityScope?: ContentVisibility;
  status?: ContentStatus;
}

// ===================================================================
// Admin (authenticated)
// ===================================================================

export function getCategories(activeOnly = false) {
  const query = activeOnly ? "?activeOnly=true" : "";
  return apiRequest<CategoryRecord[]>(`/content/categories${query}`);
}

export function createCategory(payload: CategoryPayload) {
  return apiRequest<CategoryRecord>("/content/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCategory(id: string, payload: Partial<CategoryPayload>) {
  return apiRequest<CategoryRecord>(`/content/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCategory(id: string) {
  return apiRequest<{ id: string }>(`/content/categories/${id}`, {
    method: "DELETE",
  });
}

export function getPosts(
  filter: { status?: ContentStatus; categoryId?: string; search?: string } = {},
) {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.categoryId) params.set("categoryId", filter.categoryId);
  if (filter.search) params.set("search", filter.search);
  const query = params.toString();
  return apiRequest<PostRecord[]>(`/content/posts${query ? `?${query}` : ""}`);
}

export function getPost(id: string) {
  return apiRequest<PostRecord>(`/content/posts/${id}`);
}

export function createPost(payload: PostPayload) {
  return apiRequest<PostRecord>("/content/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePost(id: string, payload: Partial<PostPayload>) {
  return apiRequest<PostRecord>(`/content/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function publishPost(id: string) {
  return apiRequest<PostRecord>(`/content/posts/${id}/publish`, {
    method: "POST",
  });
}

export function hidePost(id: string) {
  return apiRequest<PostRecord>(`/content/posts/${id}/hide`, {
    method: "POST",
  });
}

export function setPostPinned(id: string, pinned: boolean) {
  return apiRequest<PostRecord>(`/content/posts/${id}/pin`, {
    method: "POST",
    body: JSON.stringify({ pinned }),
  });
}

export function deletePost(id: string) {
  return apiRequest<{ id: string }>(`/content/posts/${id}`, {
    method: "DELETE",
  });
}

export function getAlbums(branchId?: string) {
  const query = branchId ? `?branchId=${branchId}` : "";
  return apiRequest<AlbumRecord[]>(`/content/albums${query}`);
}

export function getAlbum(id: string) {
  return apiRequest<AlbumWithMedia>(`/content/albums/${id}`);
}

export function createAlbum(payload: AlbumPayload) {
  return apiRequest<AlbumRecord>("/content/albums", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAlbum(id: string, payload: Partial<AlbumPayload>) {
  return apiRequest<AlbumRecord>(`/content/albums/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAlbum(id: string) {
  return apiRequest<{ id: string }>(`/content/albums/${id}`, {
    method: "DELETE",
  });
}

export function getMediaList(albumId?: string) {
  const query = albumId ? `?albumId=${albumId}` : "";
  return apiRequest<MediaRecord[]>(`/content/media${query}`);
}

export function uploadMedia(
  file: File,
  meta: { albumId?: string; caption?: string } = {},
) {
  const formData = new FormData();
  formData.append("file", file);
  if (meta.albumId) formData.append("albumId", meta.albumId);
  if (meta.caption) formData.append("caption", meta.caption);
  return apiRequest<MediaRecord>("/content/media/upload", {
    method: "POST",
    body: formData,
  });
}

export function updateMedia(
  id: string,
  payload: { albumId?: string; caption?: string },
) {
  return apiRequest<MediaRecord>(`/content/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMedia(id: string) {
  return apiRequest<{ id: string }>(`/content/media/${id}`, {
    method: "DELETE",
  });
}

export function getPages() {
  return apiRequest<PageContentRecord[]>("/content/pages");
}

export function getPage(key: string) {
  return apiRequest<PageContentRecord | null>(`/content/pages/${key}`);
}

export function updatePage(
  key: string,
  payload: { title: string; content?: string },
) {
  return apiRequest<PageContentRecord>(`/content/pages/${key}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ===================================================================
// Public portal (no auth)
// ===================================================================

export function getPortalHome() {
  return apiRequest<PortalHome>("/portal/home");
}

export function getPortalCategories() {
  return apiRequest<CategoryRecord[]>("/portal/categories");
}

export function getPortalPosts(categoryId?: string) {
  const query = categoryId ? `?categoryId=${categoryId}` : "";
  return apiRequest<PostRecord[]>(`/portal/posts${query}`);
}

export function getPortalPost(slug: string) {
  return apiRequest<PostRecord>(`/portal/posts/${slug}`);
}

export function getPortalAlbums() {
  return apiRequest<AlbumSummary[]>("/portal/albums");
}

export function getPortalAlbum(id: string) {
  return apiRequest<AlbumWithMedia>(`/portal/albums/${id}`);
}

export function getPortalPage(key: string) {
  return apiRequest<PageContentRecord | null>(`/portal/pages/${key}`);
}

/** Resolves a media `url` (relative to the API) into an absolute, fetchable URL. */
export function mediaSrc(path: string) {
  return createApiUrl(path);
}

/**
 * Resolves an image reference that may be an absolute external URL or a
 * relative API path (e.g. an uploaded media `url`) into a fetchable URL.
 */
export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return createApiUrl(url);
  return url;
}

// ----- Labels -----

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
  HIDDEN: "Đã ẩn",
};

export const visibilityLabels: Record<ContentVisibility, string> = {
  PUBLIC: "Công khai",
  MEMBERS: "Thành viên",
  BRANCH: "Theo chi/nhánh",
  LEADERSHIP: "Ban điều hành",
};

export const PAGE_KEYS = {
  ABOUT: "about",
  HISTORY: "history",
  ANCESTOR: "ancestor",
  ANCESTRAL_HOUSE: "ancestral-house",
} as const;
