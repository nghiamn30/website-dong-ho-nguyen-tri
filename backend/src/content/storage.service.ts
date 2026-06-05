import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { extname, join, normalize, resolve, sep } from 'path';

export interface StoredFile {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const SAFE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

/**
 * Persists uploaded files on local disk under a configurable root. The DB stores
 * only the relative storage key, so this works the same in DB and in-memory mode.
 */
@Injectable()
export class StorageService {
  private readonly root: string;

  constructor(configService: ConfigService) {
    const configured = configService.get<string>('UPLOAD_DIR');
    this.root = configured
      ? resolve(configured)
      : resolve(process.cwd(), 'storage', 'uploads');
  }

  async save(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<StoredFile> {
    const now = new Date();
    const folder = `${now.getFullYear()}/${pad(now.getMonth() + 1)}`;
    const extension = resolveExtension(originalName, mimeType);
    const storageKey = `${folder}/${randomUUID()}${extension}`;

    const absolute = this.resolvePath(storageKey);
    await mkdir(join(this.root, folder), { recursive: true });
    await writeFile(absolute, buffer);

    return {
      storageKey,
      fileName: sanitizeFileName(originalName),
      fileSize: buffer.length,
      mimeType,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolvePath(storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await unlink(this.resolvePath(storageKey));
    } catch {
      // A missing file should not break soft-deleting metadata.
    }
  }

  /** Resolves a storage key to an absolute path, rejecting path traversal. */
  private resolvePath(storageKey: string): string {
    const normalized = normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = resolve(this.root, normalized);
    if (absolute !== this.root && !absolute.startsWith(this.root + sep)) {
      throw new Error('Invalid storage key.');
    }
    return absolute;
  }
}

function resolveExtension(originalName: string, mimeType: string): string {
  const fromName = extname(originalName).toLowerCase();
  if (/^\.[a-z0-9]{1,5}$/.test(fromName)) {
    return fromName;
  }
  return SAFE_EXTENSIONS[mimeType] ?? '';
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[\\/]/g, '_').trim();
  return base.length > 0 ? base.slice(0, 255) : 'tep-tin';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
