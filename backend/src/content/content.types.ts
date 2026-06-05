export const CONTENT_PERMISSIONS = {
  POSTS_MANAGE: 'posts.manage',
  POSTS_PUBLISH: 'posts.publish',
  CATEGORIES_MANAGE: 'categories.manage',
  ALBUMS_MANAGE: 'albums.manage',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_MANAGE: 'media.manage',
  PAGES_MANAGE: 'pages.manage',
} as const;

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'HIDDEN'] as const;
export const CONTENT_VISIBILITIES = [
  'PUBLIC',
  'MEMBERS',
  'BRANCH',
  'LEADERSHIP',
] as const;
export const MEDIA_TYPES = ['IMAGE', 'DOCUMENT', 'OTHER'] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type ContentVisibility = (typeof CONTENT_VISIBILITIES)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Page content keys used by the public portal "Giới thiệu" section. */
export const PAGE_KEYS = {
  ABOUT: 'about',
  HISTORY: 'history',
  ANCESTOR: 'ancestor',
  ANCESTRAL_HOUSE: 'ancestral-house',
} as const;

export type PageKey = (typeof PAGE_KEYS)[keyof typeof PAGE_KEYS];

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
  /** Internal storage key relative to the upload root. */
  fileUrl: string;
  /** Public URL (relative to the API base) used by clients to fetch the file. */
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

export interface AlbumSummary extends AlbumRecord {
  coverUrl?: string;
  mediaCount: number;
}
