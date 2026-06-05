import { forwardRef, Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { BranchScopeModule } from '../branch-scope/branch-scope.module';
import { GenealogyController } from './genealogy.controller';
import { GenealogyRepository } from './genealogy.repository';
import { GenealogyService } from './genealogy.service';

@Module({
  imports: [AuditLogModule, forwardRef(() => BranchScopeModule)],
  controllers: [GenealogyController],
  providers: [GenealogyRepository, GenealogyService],
  exports: [GenealogyRepository, GenealogyService],
})
export class GenealogyModule {}
