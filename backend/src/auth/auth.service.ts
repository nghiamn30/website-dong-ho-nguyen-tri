import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly loginFailures = new Map<
    string,
    { count: number; firstFailedAt: number; lockedUntil?: number }
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(loginDto: LoginDto, request: Request) {
    const employeeCode = loginDto.employeeCode.trim().toUpperCase();
    const rateLimitKey = this.loginRateLimitKey(employeeCode, request);
    this.assertLoginAllowed(rateLimitKey);
    const userRecord = await this.usersService.findByEmployeeCode(employeeCode);
    const userAgent = this.getUserAgent(request);
    const validPassword = userRecord
      ? await bcrypt.compare(loginDto.password, userRecord.passwordHash)
      : false;

    if (!userRecord || !userRecord.isActive || !validPassword) {
      this.recordLoginFailure(rateLimitKey);
      await this.auditLogService.create({
        action: 'auth.login_failed',
        employeeCode,
        success: false,
        important: true,
        ipAddress: request.ip,
        userAgent,
      });

      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Mã tài khoản hoặc mật khẩu không đúng.',
      });
    }

    this.loginFailures.delete(rateLimitKey);
    const user = await this.usersService.toSafeUser(userRecord);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      employeeCode: user.employeeCode,
      roles: user.roles.map((role) => role.code),
      permissions: user.permissions,
    });

    await this.auditLogService.create({
      action: 'auth.login_success',
      actorUserId: user.id,
      employeeCode: user.employeeCode,
      success: true,
      important: true,
      ipAddress: request.ip,
      userAgent,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h',
      user,
    };
  }

  getMe(user: RequestUser) {
    return user;
  }

  async logout(user: RequestUser, request: Request) {
    const userAgent = this.getUserAgent(request);

    await this.auditLogService.create({
      action: 'auth.logout',
      actorUserId: user.id,
      employeeCode: user.employeeCode,
      success: true,
      important: true,
      ipAddress: request.ip,
      userAgent,
    });

    return {
      success: true,
    };
  }

  private getUserAgent(request: Request): string | undefined {
    const userAgent = request.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent;
  }

  private assertLoginAllowed(key: string) {
    const failure = this.loginFailures.get(key);
    const now = Date.now();

    if (!failure?.lockedUntil || failure.lockedUntil <= now) {
      return;
    }

    throw new HttpException(
      {
        code: 'LOGIN_RATE_LIMITED',
        message: 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private recordLoginFailure(key: string) {
    const now = Date.now();
    const windowMs = this.getLoginWindowSeconds() * 1000;
    const maxAttempts = this.getLoginMaxAttempts();
    const current = this.loginFailures.get(key);
    const failure =
      current && now - current.firstFailedAt <= windowMs
        ? current
        : { count: 0, firstFailedAt: now };

    failure.count += 1;

    if (failure.count >= maxAttempts) {
      failure.lockedUntil = now + windowMs;
    }

    this.loginFailures.set(key, failure);
  }

  private loginRateLimitKey(employeeCode: string, request: Request) {
    return `${employeeCode}:${request.ip ?? 'unknown'}`;
  }

  private getLoginMaxAttempts() {
    return Number(
      this.configService.get<string>('AUTH_LOGIN_MAX_ATTEMPTS') ?? 5,
    );
  }

  private getLoginWindowSeconds() {
    return Number(
      this.configService.get<string>('AUTH_LOGIN_WINDOW_SECONDS') ?? 900,
    );
  }
}
