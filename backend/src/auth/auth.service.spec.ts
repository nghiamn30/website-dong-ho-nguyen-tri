import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogRepository } from '../audit-log/audit-log.repository';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const request = {
  ip: '127.0.0.1',
  headers: {
    'user-agent': 'jest',
  },
} as never;

describe('AuthService', () => {
  let service: AuthService;
  let auditLogService: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersRepository,
        UsersService,
        AuditLogRepository,
        AuditLogService,
        ConfigService,
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'test-secret' }),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('logs in seeded admin and returns all permissions', async () => {
    const result = await service.login(
      {
        employeeCode: 'admin001',
        password: 'admin123',
      },
      request,
    );

    expect(result.user.employeeCode).toBe('ADMIN001');
    expect(result.user.permissions).toContain('users.manage');
    expect(result.user.permissions).toContain('dashboard.view');
    expect(result.accessToken).toEqual(expect.any(String));
  });

  it('logs important login failures with a unified error code', async () => {
    try {
      await service.login(
        {
          employeeCode: 'ADMIN001',
          password: 'wrong-password',
        },
        request,
      );
      throw new Error('Expected login to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      const response = (error as UnauthorizedException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe('INVALID_CREDENTIALS');
    }

    expect((await auditLogService.list())[0]).toEqual(
      expect.objectContaining({
        action: 'auth.login_failed',
        important: true,
        success: false,
      }),
    );
  });
});
