import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CalendarModule } from '../calendar/calendar.module';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { ContentController } from './content.controller';
import { ContentRepository } from './content.repository';
import { ContentService } from './content.service';
import { PortalController } from './portal.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [AuditLogModule, GenealogyModule, CalendarModule],
  controllers: [ContentController, PortalController],
  providers: [ContentRepository, ContentService, StorageService],
  exports: [ContentRepository, ContentService],
})
export class ContentModule {}
