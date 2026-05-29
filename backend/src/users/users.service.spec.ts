import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { ROLE_CODES } from './user.types';

const adminActor: RequestUser = {
  id: '00000000-0000-4000-8000-000000000001',
  employeeCode: 'ADMIN001',
  name: 'Quản trị viên hệ thống',
  roles: [{ code: ROLE_CODES.ADMIN, name: 'Quản trị viên' }],
  permissions: ['users.manage'],
  defaultPath: '/dashboard',
};

describe('UsersService delete', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        UsersService,
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    await service.onModuleInit();
  });

  it('blocks deleting the account currently logged in', async () => {
    await expect(service.deleteUser('ADMIN001', adminActor)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('blocks deleting the last admin account', async () => {
    const operator = await service.createUser({
      employeeCode: 'USER001',
      name: 'Người dùng kiểm thử',
      password: 'secret123',
      roleCode: ROLE_CODES.NGUOI_BINH_THUONG,
    });

    await expect(
      service.deleteUser('ADMIN001', {
        ...adminActor,
        id: operator.id,
        employeeCode: operator.employeeCode,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('deletes an unreferenced non-admin account', async () => {
    await service.createUser({
      employeeCode: 'USER001',
      name: 'Người dùng kiểm thử',
      password: 'secret123',
      roleCode: ROLE_CODES.NGUOI_BINH_THUONG,
    });

    await expect(service.deleteUser('USER001', adminActor)).resolves.toEqual({
      employeeCode: 'USER001',
    });
    const remaining = await service.listUsers();
    expect(remaining.some((user) => user.employeeCode === 'USER001')).toBe(
      false,
    );
  });
});
