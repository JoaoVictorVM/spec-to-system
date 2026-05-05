import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import ms from 'ms';
import { authConfig } from '../config/auth.config';
import { cookieConfig } from '../config/cookie.config';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_COOKIE_PATH = '/';
const REFRESH_COOKIE_PATH = '/auth';

@Injectable()
export class CookiesService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    @Inject(cookieConfig.KEY)
    private readonly cookie: ConfigType<typeof cookieConfig>,
  ) {}

  setAccessTokenCookie(res: Response, token: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: this.cookie.sameSite,
      domain: this.cookie.domain,
      path: ACCESS_COOKIE_PATH,
      maxAge: this.parseDuration(this.auth.accessExpiresIn),
    });
  }

  setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: this.cookie.sameSite,
      domain: this.cookie.domain,
      path: REFRESH_COOKIE_PATH,
      maxAge: this.parseDuration(this.auth.refreshExpiresIn),
    });
  }

  clearAuthCookies(res: Response): void {
    const baseOptions = {
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: this.cookie.sameSite,
      domain: this.cookie.domain,
    } as const;
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      ...baseOptions,
      path: ACCESS_COOKIE_PATH,
    });
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...baseOptions,
      path: REFRESH_COOKIE_PATH,
    });
  }

  readRefreshToken(req: Request): string | null {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const value = cookies?.[REFRESH_TOKEN_COOKIE];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private parseDuration(input: string): number {
    const result = ms(input as ms.StringValue);
    if (typeof result !== 'number' || result <= 0) {
      throw new Error(`Invalid duration: ${input}`);
    }
    return result;
  }
}
