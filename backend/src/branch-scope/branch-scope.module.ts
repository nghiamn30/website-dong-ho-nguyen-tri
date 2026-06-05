import { forwardRef, Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { BranchScopeController } from './branch-scope.controller';
import { BranchScopeRepository } from './branch-scope.repository';
import { BranchScopeService } from './branch-scope.service';

@Module({
  imports: [AuditLogModule, forwardRef(() => GenealogyModule)],
  controllers: [BranchScopeController],
  providers: [BranchScopeRepository, BranchScopeService],
  exports: [BranchScopeService],
})
export class BranchScopeModule {}
