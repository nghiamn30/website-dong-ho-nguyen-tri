import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GenealogyController } from './genealogy.controller';
import { GenealogyRepository } from './genealogy.repository';
import { GenealogyService } from './genealogy.service';

@Module({
  imports: [AuditLogModule],
  controllers: [GenealogyController],
  providers: [GenealogyRepository, GenealogyService],
  exports: [GenealogyRepository, GenealogyService],
})
export class GenealogyModule {}
