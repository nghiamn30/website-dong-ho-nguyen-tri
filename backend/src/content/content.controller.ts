import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import {
  ContentService,
  UploadedFile as UploadedFileType,
} from './content.service';
import { CONTENT_PERMISSIONS } from './content.types';
import type { ContentStatus } from './content.types';
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

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ----- Categories -----

  @Get('categories')
  listCategories(@Query('activeOnly') activeOnly?: string) {
    return this.contentService.listCategories(activeOnly === 'true');
  }

  @Post('categories')
  @Permissions(CONTENT_PERMISSIONS.CATEGORIES_MANAGE)
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.createCategory(dto);
    await this.audit('content.categories.create', actor, {
      categoryId: result.id,
    });
    return result;
  }

  @Patch('categories/:id')
  @Permissions(CONTENT_PERMISSIONS.CATEGORIES_MANAGE)
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.updateCategory(id, dto);
    await this.audit('content.categories.update', actor, { categoryId: id });
    return result;
  }

  @Delete('categories/:id')
  @Permissions(CONTENT_PERMISSIONS.CATEGORIES_MANAGE)
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.deleteCategory(id);
    await this.audit('content.categories.delete', actor, result);
    return result;
  }

  // ----- Posts -----

  @Get('posts')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  listPosts(
    @Query('status') status?: ContentStatus,
    @Query('categoryId') categoryId?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    return this.contentService.listPosts({
      statuses: status ? [status] : undefined,
      categoryId,
      branchId,
      search,
    });
  }

  @Get('posts/:id')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  getPost(@Param('id') id: string) {
    return this.contentService.getPost(id);
  }

  @Post('posts')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  async createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.createPost(dto, actor);
    await this.audit('content.posts.create', actor, {
      postId: result.id,
      status: result.status,
    });
    return result;
  }

  @Patch('posts/:id')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.updatePost(id, dto, actor);
    await this.audit('content.posts.update', actor, { postId: id });
    return result;
  }

  @Post('posts/:id/publish')
  @Permissions(CONTENT_PERMISSIONS.POSTS_PUBLISH)
  async publishPost(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.setPostStatus(
      id,
      'PUBLISHED',
      actor,
    );
    await this.audit('content.posts.publish', actor, { postId: id });
    return result;
  }

  @Post('posts/:id/hide')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  async hidePost(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    const result = await this.contentService.setPostStatus(id, 'HIDDEN', actor);
    await this.audit('content.posts.hide', actor, { postId: id });
    return result;
  }

  @Post('posts/:id/pin')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  async pinPost(
    @Param('id') id: string,
    @Body() body: { pinned?: boolean },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.setPostPinned(
      id,
      body.pinned ?? true,
      actor,
    );
    await this.audit('content.posts.pin', actor, {
      postId: id,
      pinned: result.isPinned,
    });
    return result;
  }

  @Delete('posts/:id')
  @Permissions(CONTENT_PERMISSIONS.POSTS_MANAGE)
  async deletePost(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    const result = await this.contentService.deletePost(id, actor);
    await this.audit('content.posts.delete', actor, result);
    return result;
  }

  // ----- Albums -----

  @Get('albums')
  @Permissions(CONTENT_PERMISSIONS.ALBUMS_MANAGE)
  listAlbums(@Query('branchId') branchId?: string) {
    return this.contentService.listAlbums({ branchId });
  }

  @Get('albums/:id')
  @Permissions(CONTENT_PERMISSIONS.ALBUMS_MANAGE)
  getAlbum(@Param('id') id: string) {
    return this.contentService.getAlbumWithMedia(id);
  }

  @Post('albums')
  @Permissions(CONTENT_PERMISSIONS.ALBUMS_MANAGE)
  async createAlbum(
    @Body() dto: CreateAlbumDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.createAlbum(dto, actor);
    await this.audit('content.albums.create', actor, { albumId: result.id });
    return result;
  }

  @Patch('albums/:id')
  @Permissions(CONTENT_PERMISSIONS.ALBUMS_MANAGE)
  async updateAlbum(
    @Param('id') id: string,
    @Body() dto: UpdateAlbumDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.updateAlbum(id, dto, actor);
    await this.audit('content.albums.update', actor, { albumId: id });
    return result;
  }

  @Delete('albums/:id')
  @Permissions(CONTENT_PERMISSIONS.ALBUMS_MANAGE)
  async deleteAlbum(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.deleteAlbum(id, actor);
    await this.audit('content.albums.delete', actor, result);
    return result;
  }

  // ----- Media -----

  @Get('media')
  @Permissions(CONTENT_PERMISSIONS.MEDIA_MANAGE)
  listMedia(@Query('albumId') albumId?: string) {
    return this.contentService.listMedia(albumId);
  }

  @Post('media/upload')
  @Permissions(CONTENT_PERMISSIONS.MEDIA_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async uploadMedia(
    @UploadedFile() file: UploadedFileType | undefined,
    @Body() dto: UploadMediaDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.uploadMedia(file, dto, actor);
    await this.audit('content.media.upload', actor, {
      mediaId: result.id,
      fileType: result.fileType,
      fileSize: result.fileSize,
    });
    return result;
  }

  @Patch('media/:id')
  @Permissions(CONTENT_PERMISSIONS.MEDIA_MANAGE)
  async updateMedia(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.updateMedia(id, dto);
    await this.audit('content.media.update', actor, { mediaId: id });
    return result;
  }

  @Delete('media/:id')
  @Permissions(CONTENT_PERMISSIONS.MEDIA_MANAGE)
  async deleteMedia(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.deleteMedia(id);
    await this.audit('content.media.delete', actor, result);
    return result;
  }

  // ----- Page content -----

  @Get('pages')
  @Permissions(CONTENT_PERMISSIONS.PAGES_MANAGE)
  listPages() {
    return this.contentService.listPages();
  }

  @Get('pages/:key')
  @Permissions(CONTENT_PERMISSIONS.PAGES_MANAGE)
  getPage(@Param('key') key: string) {
    return this.contentService.getPage(key);
  }

  @Put('pages/:key')
  @Permissions(CONTENT_PERMISSIONS.PAGES_MANAGE)
  async updatePage(
    @Param('key') key: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.contentService.updatePage(key, dto, actor);
    await this.audit('content.pages.update', actor, { key });
    return result;
  }

  private async audit(
    action: string,
    actor: RequestUser,
    metadata?: Record<string, unknown>,
  ) {
    await this.auditLogService.create({
      action,
      actorUserId: actor.id,
      employeeCode: actor.employeeCode,
      success: true,
      important: true,
      metadata,
    });
  }
}
