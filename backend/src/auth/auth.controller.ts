import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CookiesService } from './cookies.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { PublicUser } from '../users/users.types';

const ONE_MINUTE_MS = 60_000;
const STRICT_AUTH_LIMIT = 5;

interface AuthSessionResponse {
  user: PublicUser;
}

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: CookiesService,
  ) {}

  @Throttle({ default: { limit: STRICT_AUTH_LIMIT, ttl: ONE_MINUTE_MS } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Throttle({ default: { limit: STRICT_AUTH_LIMIT, ttl: ONE_MINUTE_MS } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const result = await this.auth.login(dto);
    this.cookies.setAccessTokenCookie(res, result.accessToken);
    this.cookies.setRefreshTokenCookie(res, result.refreshToken);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const plain = this.cookies.readRefreshToken(req);
    await this.auth.logout(plain);
    this.cookies.clearAuthCookies(res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const plain = this.cookies.readRefreshToken(req);
    if (!plain) {
      throw new UnauthorizedException('Missing refresh token');
    }

    try {
      const result = await this.auth.refresh(plain);
      this.cookies.setAccessTokenCookie(res, result.accessToken);
      this.cookies.setRefreshTokenCookie(res, result.refreshToken);
      return { user: result.user };
    } catch (error) {
      // Stale or invalid token → clear cookies so the client doesn't keep retrying.
      this.cookies.clearAuthCookies(res);
      throw error;
    }
  }
}
