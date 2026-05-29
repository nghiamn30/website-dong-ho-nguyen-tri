import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { buildAuthCookie, buildClearAuthCookie } from './auth-cookie';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Public()
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto, request);
    response.setHeader(
      'Set-Cookie',
      buildAuthCookie(result.accessToken, this.configService),
    );
    return result;
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user);
  }

  @Post('logout')
  logout(
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Set-Cookie', buildClearAuthCookie(this.configService));
    return this.authService.logout(user, request);
  }
}
