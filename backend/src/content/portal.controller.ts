import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

/**
 * Public, unauthenticated portal endpoints. Only PUBLIC + PUBLISHED content is
 * ever exposed here; the guard chain is bypassed via @Public().
 */
@Public()
@Controller('portal')
export class PortalController {
  constructor(private readonly contentService: ContentService) {}

  @Get('home')
  getHome() {
    return this.contentService.getPortalHome();
  }

  @Get('categories')
  listCategories() {
    return this.contentService.listCategories(true);
  }

  @Get('posts')
  listPosts(@Query('categoryId') categoryId?: string) {
    return this.contentService.listPublicPosts(categoryId);
  }

  @Get('posts/:slug')
  getPost(@Param('slug') slug: string) {
    return this.contentService.getPublicPost(slug);
  }

  @Get('albums')
  listAlbums() {
    return this.contentService.listPublicAlbumSummaries();
  }

  @Get('albums/:id')
  getAlbum(@Param('id') id: string) {
    return this.contentService.getPublicAlbum(id);
  }

  @Get('pages/:key')
  getPage(@Param('key') key: string) {
    return this.contentService.getPage(key);
  }

  @Get('media/:id/raw')
  @Header('Cache-Control', 'public, max-age=86400')
  async getMediaFile(@Param('id') id: string): Promise<StreamableFile> {
    try {
      const { media, buffer } = await this.contentService.readMediaFile(id);
      const disposition =
        media.fileType === 'DOCUMENT'
          ? `attachment; filename="${encodeURIComponent(media.fileName)}"`
          : 'inline';
      return new StreamableFile(buffer, {
        type: media.mimeType,
        disposition,
      });
    } catch {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Không tìm thấy tệp tin.',
      });
    }
  }
}
