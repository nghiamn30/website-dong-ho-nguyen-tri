import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { ChangeRequestsController } from './change-requests.controller';
import { ChangeRequestsRepository } from './change-requests.repository';
import { ChangeRequestsService } from './change-requests.service';

@Module({
  imports: [AuditLogModule, GenealogyModule],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsRepository, ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
