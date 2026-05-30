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
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import {
  CreateBranchDto,
  CreateMarriageDto,
  CreateParentChildDto,
  CreatePersonDto,
  TransferLeadershipDto,
  UpdateBranchDto,
  UpdateMarriageDto,
  UpdatePersonDto,
  UpsertClanDto,
} from './dto/genealogy.dto';
import { GenealogyService } from './genealogy.service';
import { GENEALOGY_PERMISSIONS } from './genealogy.types';

@Controller('genealogy')
export class GenealogyController {
  constructor(
    private readonly genealogyService: GenealogyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ----- Clan -----

  @Get('clan')
  getClan() {
    return this.genealogyService.getClan();
  }

  @Put('clan')
  @Permissions(GENEALOGY_PERMISSIONS.CLAN_MANAGE)
  async upsertClan(
    @Body() dto: UpsertClanDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.upsertClan(dto);
    await this.auditMutation('genealogy.clan.upsert', actor, {
      clanId: result.id,
    });
    return result;
  }

  // ----- Branches -----

  @Get('branches')
  listBranches() {
    return this.genealogyService.listBranches();
  }

  @Get('branches/tree')
  getBranchTree() {
    return this.genealogyService.getBranchTree();
  }

  @Get('branches/:id/leadership-history')
  getLeadershipHistory(@Param('id') id: string) {
    return this.genealogyService.getLeadershipHistory(id);
  }

  @Post('branches')
  @Permissions(GENEALOGY_PERMISSIONS.BRANCHES_MANAGE)
  async createBranch(
    @Body() dto: CreateBranchDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.createBranch(dto);
    await this.auditMutation('genealogy.branches.create', actor, {
      branchId: result.id,
    });
    return result;
  }

  @Patch('branches/:id')
  @Permissions(GENEALOGY_PERMISSIONS.BRANCHES_MANAGE)
  async updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.updateBranch(id, dto);
    await this.auditMutation('genealogy.branches.update', actor, {
      branchId: result.id,
    });
    return result;
  }

  @Post('branches/:id/transfer-leadership')
  @Permissions(GENEALOGY_PERMISSIONS.BRANCHES_MANAGE)
  async transferLeadership(
    @Param('id') id: string,
    @Body() dto: TransferLeadershipDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.transferLeadership(
      id,
      dto,
      actor.id,
    );
    await this.auditMutation('genealogy.branches.transfer-leadership', actor, {
      branchId: id,
      headPersonId: result.headPersonId,
    });
    return result;
  }

  @Delete('branches/:id')
  @Permissions(GENEALOGY_PERMISSIONS.BRANCHES_MANAGE)
  async archiveBranch(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.archiveBranch(id);
    await this.auditMutation('genealogy.branches.archive', actor, {
      branchId: result.id,
    });
    return result;
  }

  // ----- Persons -----

  @Get('persons')
  listPersons(
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    return this.genealogyService.listPersons({ branchId, search });
  }

  @Get('persons/:id')
  getPerson(@Param('id') id: string) {
    return this.genealogyService.getPerson(id);
  }

  @Get('persons/:id/relations')
  getPersonRelations(@Param('id') id: string) {
    return this.genealogyService.getPersonRelations(id);
  }

  @Post('persons')
  @Permissions(GENEALOGY_PERMISSIONS.PERSONS_MANAGE)
  async createPerson(
    @Body() dto: CreatePersonDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.createPerson(dto);
    await this.auditMutation('genealogy.persons.create', actor, {
      personId: result.id,
    });
    return result;
  }

  @Patch('persons/:id')
  @Permissions(GENEALOGY_PERMISSIONS.PERSONS_MANAGE)
  async updatePerson(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.updatePerson(id, dto);
    await this.auditMutation('genealogy.persons.update', actor, {
      personId: result.id,
    });
    return result;
  }

  @Delete('persons/:id')
  @Permissions(GENEALOGY_PERMISSIONS.PERSONS_MANAGE)
  async deletePerson(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.deletePerson(id);
    await this.auditMutation('genealogy.persons.delete', actor, result);
    return result;
  }

  // ----- Parent/child relations -----

  @Get('parent-child')
  listParentChild() {
    return this.genealogyService.listParentChild();
  }

  @Post('parent-child')
  @Permissions(GENEALOGY_PERMISSIONS.RELATIONSHIPS_MANAGE)
  async createParentChild(
    @Body() dto: CreateParentChildDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.createParentChild(dto);
    await this.auditMutation('genealogy.parent-child.create', actor, {
      relationId: result.id,
    });
    return result;
  }

  @Delete('parent-child/:id')
  @Permissions(GENEALOGY_PERMISSIONS.RELATIONSHIPS_MANAGE)
  async deleteParentChild(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.deleteParentChild(id);
    await this.auditMutation('genealogy.parent-child.delete', actor, result);
    return result;
  }

  // ----- Marriages -----

  @Get('marriages')
  listMarriages() {
    return this.genealogyService.listMarriages();
  }

  @Post('marriages')
  @Permissions(GENEALOGY_PERMISSIONS.RELATIONSHIPS_MANAGE)
  async createMarriage(
    @Body() dto: CreateMarriageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.createMarriage(dto);
    await this.auditMutation('genealogy.marriages.create', actor, {
      marriageId: result.id,
    });
    return result;
  }

  @Patch('marriages/:id')
  @Permissions(GENEALOGY_PERMISSIONS.RELATIONSHIPS_MANAGE)
  async updateMarriage(
    @Param('id') id: string,
    @Body() dto: UpdateMarriageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.updateMarriage(id, dto);
    await this.auditMutation('genealogy.marriages.update', actor, {
      marriageId: result.id,
    });
    return result;
  }

  @Delete('marriages/:id')
  @Permissions(GENEALOGY_PERMISSIONS.RELATIONSHIPS_MANAGE)
  async deleteMarriage(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.genealogyService.deleteMarriage(id);
    await this.auditMutation('genealogy.marriages.delete', actor, result);
    return result;
  }

  // ----- Family tree -----

  @Get('family-tree')
  getFamilyTree(
    @Query('branchId') branchId?: string,
    @Query('personId') personId?: string,
  ) {
    return this.genealogyService.getFamilyTree({ branchId, personId });
  }

  private async auditMutation(
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
