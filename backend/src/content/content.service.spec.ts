import { CalendarRepository } from '../calendar/calendar.repository';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { GenealogyRepository } from '../genealogy/genealogy.repository';
import { GenealogyService } from '../genealogy/genealogy.service';
import { PERMISSIONS } from '../users/user.types';
import { ContentRepository } from './content.repository';
import { ContentService, UploadedFile } from './content.service';
import { StorageService } from './storage.service';

function clanManager(overrides: Partial<RequestUser> = {}): RequestUser {
  return {
    id: 'admin-1',
    employeeCode: 'ADMIN001',
    name: 'Quản trị',
    roles: [],
    permissions: [
      PERMISSIONS.CLAN_MANAGE,
      PERMISSIONS.POSTS_MANAGE,
      PERMISSIONS.POSTS_PUBLISH,
      PERMISSIONS.CATEGORIES_MANAGE,
      PERMISSIONS.ALBUMS_MANAGE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.PAGES_MANAGE,
    ],
    defaultPath: '/dashboard',
    ...overrides,
  };
}

function branchHead(personId: string): RequestUser {
  return {
    id: `user-${personId}`,
    employeeCode: 'CHI001',
    name: 'Trưởng chi',
    personId,
    roles: [],
    permissions: [
      PERMISSIONS.POSTS_MANAGE,
      PERMISSIONS.ALBUMS_MANAGE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_MANAGE,
    ],
    defaultPath: '/dashboard',
  };
}

function stubStorage(): StorageService {
  return {
    save: jest.fn((buffer: Buffer, originalName: string, mimeType: string) =>
      Promise.resolve({
        storageKey: `2026/05/${originalName}`,
        fileName: originalName,
        fileSize: buffer.length,
        mimeType,
      }),
    ),
    read: jest.fn(() => Promise.resolve(Buffer.from('data'))),
    remove: jest.fn(() => Promise.resolve()),
  } as unknown as StorageService;
}

function imageFile(size = 1024): UploadedFile {
  return {
    originalname: 'anh.jpg',
    mimetype: 'image/jpeg',
    size,
    buffer: Buffer.from('image-bytes'),
  };
}

async function makeFixture() {
  const genealogyRepo = new GenealogyRepository();
  const genealogy = new GenealogyService(genealogyRepo);
  await genealogy.upsertClan({ name: 'Dòng họ Nguyễn Trí' });
  const calendarRepo = new CalendarRepository();
  const contentRepo = new ContentRepository();
  const storage = stubStorage();
  const content = new ContentService(
    contentRepo,
    genealogyRepo,
    calendarRepo,
    storage,
  );
  return {
    genealogy,
    genealogyRepo,
    calendarRepo,
    contentRepo,
    content,
    storage,
  };
}

describe('ContentService - posts', () => {
  it('generates a unique slug when titles collide', async () => {
    const { content } = await makeFixture();
    const first = await content.createPost(
      { title: 'Thông báo họp họ' },
      clanManager(),
    );
    const second = await content.createPost(
      { title: 'Thông báo họp họ' },
      clanManager(),
    );
    expect(first.slug).toBe('thong-bao-hop-ho');
    expect(second.slug).toBe('thong-bao-hop-ho-2');
  });

  it('publishes for clan managers and sets publishedAt', async () => {
    const { content } = await makeFixture();
    const post = await content.createPost(
      { title: 'Tin vui', status: 'PUBLISHED' },
      clanManager(),
    );
    expect(post.status).toBe('PUBLISHED');
    expect(post.publishedAt).toBeDefined();
  });

  it('keeps posts as draft when the actor cannot publish', async () => {
    const { genealogy, content } = await makeFixture();
    const branch = await genealogy.createBranch({ name: 'Chi A' });
    const head = await genealogy.createPerson({
      fullName: 'Trưởng chi A',
      gender: 'MALE',
      branchId: branch.id,
      lifeStatus: 'LIVING',
    });
    await genealogy.updateBranch(branch.id, { headPersonId: head.id });

    const post = await content.createPost(
      { title: 'Bản tin chi', status: 'PUBLISHED', branchId: branch.id },
      branchHead(head.id),
    );
    expect(post.status).toBe('DRAFT');
  });

  it('restricts a branch head to their own branch scope', async () => {
    const { genealogy, content } = await makeFixture();
    const branchA = await genealogy.createBranch({ name: 'Chi A' });
    const branchB = await genealogy.createBranch({ name: 'Chi B' });
    const head = await genealogy.createPerson({
      fullName: 'Trưởng chi A',
      gender: 'MALE',
      branchId: branchA.id,
      lifeStatus: 'LIVING',
    });
    await genealogy.updateBranch(branchA.id, { headPersonId: head.id });

    await expect(
      content.createPost(
        { title: 'Ngoài phạm vi', branchId: branchB.id },
        branchHead(head.id),
      ),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      content.createPost({ title: 'Toàn họ' }, branchHead(head.id)),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('toggles pin and hides posts', async () => {
    const { content } = await makeFixture();
    const post = await content.createPost(
      { title: 'Bài ghim', status: 'PUBLISHED' },
      clanManager(),
    );
    const pinned = await content.setPostPinned(post.id, true, clanManager());
    expect(pinned.isPinned).toBe(true);

    const hidden = await content.setPostStatus(
      post.id,
      'HIDDEN',
      clanManager(),
    );
    expect(hidden.status).toBe('HIDDEN');
  });

  it('links posts to an existing event and rejects unknown events', async () => {
    const { content, calendarRepo, genealogyRepo } = await makeFixture();
    const clan = await genealogyRepo.getClan();
    const event = await calendarRepo.createEvent({
      clanId: clan!.id,
      branchId: null,
      sourceType: 'MANUAL',
      sourceId: null,
      title: 'Giỗ tổ',
      eventType: 'ANCESTOR_ANNIVERSARY',
      description: null,
      calendarType: 'SOLAR',
      lunarDay: null,
      lunarMonth: null,
      isLeapMonth: false,
      startDatetime: '2026-03-10T00:00:00+07:00',
      endDatetime: null,
      location: null,
      visibilityScope: 'CLAN',
      status: 'PUBLISHED',
      createdBy: null,
    });

    const post = await content.createPost(
      { title: 'Tường thuật giỗ tổ', relatedEventId: event.id },
      clanManager(),
    );
    expect(post.relatedEventId).toBe(event.id);

    await expect(
      content.createPost(
        {
          title: 'Sự kiện sai',
          relatedEventId: '00000000-0000-4000-8000-000000009999',
        },
        clanManager(),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('ContentService - public visibility', () => {
  it('exposes only published public posts to the portal', async () => {
    const { content } = await makeFixture();
    await content.createPost(
      { title: 'Công khai', status: 'PUBLISHED', visibilityScope: 'PUBLIC' },
      clanManager(),
    );
    await content.createPost(
      { title: 'Bản nháp', status: 'DRAFT', visibilityScope: 'PUBLIC' },
      clanManager(),
    );
    await content.createPost(
      { title: 'Nội bộ', status: 'PUBLISHED', visibilityScope: 'MEMBERS' },
      clanManager(),
    );

    const publicPosts = await content.listPublicPosts();
    expect(publicPosts).toHaveLength(1);
    expect(publicPosts[0].title).toBe('Công khai');
  });

  it('hides non-public posts behind a 404 on the portal', async () => {
    const { content } = await makeFixture();
    const draft = await content.createPost(
      { title: 'Riêng tư', status: 'DRAFT' },
      clanManager(),
    );
    await expect(content.getPublicPost(draft.slug)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('only lists published public albums with cover and count', async () => {
    const { content } = await makeFixture();
    const album = await content.createAlbum(
      { title: 'Lễ giỗ tổ', status: 'PUBLISHED', visibilityScope: 'PUBLIC' },
      clanManager(),
    );
    await content.createAlbum(
      { title: 'Album nháp', status: 'DRAFT' },
      clanManager(),
    );
    await content.uploadMedia(
      imageFile(),
      { albumId: album.id },
      clanManager(),
    );

    const summaries = await content.listPublicAlbumSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].title).toBe('Lễ giỗ tổ');
    expect(summaries[0].mediaCount).toBe(1);
    expect(summaries[0].coverUrl).toContain('/portal/media/');
  });
});

describe('ContentService - media upload validation', () => {
  it('accepts a valid image', async () => {
    const { content } = await makeFixture();
    const media = await content.uploadMedia(imageFile(), {}, clanManager());
    expect(media.fileType).toBe('IMAGE');
  });

  it('rejects a disallowed file type', async () => {
    const { content } = await makeFixture();
    const file: UploadedFile = {
      originalname: 'virus.exe',
      mimetype: 'application/x-msdownload',
      size: 1024,
      buffer: Buffer.from('x'),
    };
    await expect(
      content.uploadMedia(file, {}, clanManager()),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects an oversized image', async () => {
    const { content } = await makeFixture();
    await expect(
      content.uploadMedia(imageFile(6 * 1024 * 1024), {}, clanManager()),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('requires a file', async () => {
    const { content } = await makeFixture();
    await expect(
      content.uploadMedia(undefined, {}, clanManager()),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('ContentService - categories', () => {
  it('blocks deleting a category still used by posts', async () => {
    const { content } = await makeFixture();
    const category = await content.createCategory({ name: 'Thông báo' });
    await content.createPost(
      { title: 'Có chuyên mục', categoryId: category.id },
      clanManager(),
    );
    await expect(content.deleteCategory(category.id)).rejects.toMatchObject({
      status: 409,
    });
  });
});
