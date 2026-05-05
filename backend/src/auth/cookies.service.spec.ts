import { Test, type TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import {
  CookiesService,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './cookies.service';
import { authConfig } from '../config/auth.config';
import { cookieConfig } from '../config/cookie.config';

interface CookieCall {
  name: string;
  value: string;
  options: Record<string, unknown>;
}

interface ClearCookieCall {
  name: string;
  options: Record<string, unknown>;
}

interface MockResponse {
  cookieCalls: CookieCall[];
  clearCookieCalls: ClearCookieCall[];
  cookie: jest.Mock;
  clearCookie: jest.Mock;
  asResponse(): Response;
}

function makeMockResponse(): MockResponse {
  const cookieCalls: CookieCall[] = [];
  const clearCookieCalls: ClearCookieCall[] = [];

  const cookie = jest.fn(
    (name: string, value: string, options: Record<string, unknown>) => {
      cookieCalls.push({ name, value, options });
    },
  );
  const clearCookie = jest.fn(
    (name: string, options: Record<string, unknown>) => {
      clearCookieCalls.push({ name, options });
    },
  );

  return {
    cookieCalls,
    clearCookieCalls,
    cookie,
    clearCookie,
    asResponse(): Response {
      return { cookie, clearCookie } as unknown as Response;
    },
  };
}

describe('CookiesService', () => {
  let service: CookiesService;

  const fakeAuthCfg = {
    accessSecret: 'a',
    accessExpiresIn: '15m',
    refreshSecret: 'b',
    refreshExpiresIn: '7d',
  };
  const fakeCookieCfg = {
    domain: 'example.test',
    secure: true,
    sameSite: 'lax' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CookiesService,
        { provide: authConfig.KEY, useValue: fakeAuthCfg },
        { provide: cookieConfig.KEY, useValue: fakeCookieCfg },
      ],
    }).compile();

    service = module.get(CookiesService);
  });

  describe('setAccessTokenCookie', () => {
    it('sets a HttpOnly cookie at root path with maxAge from access expiry', () => {
      const res = makeMockResponse();
      service.setAccessTokenCookie(res.asResponse(), 'access-jwt');

      expect(res.cookieCalls).toHaveLength(1);
      const call = res.cookieCalls[0];
      expect(call?.name).toBe(ACCESS_TOKEN_COOKIE);
      expect(call?.value).toBe('access-jwt');
      expect(call?.options).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: 'example.test',
        path: '/',
      });
      expect(call?.options.maxAge).toBe(15 * 60 * 1000);
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('restricts the refresh cookie to the /auth path', () => {
      const res = makeMockResponse();
      service.setRefreshTokenCookie(res.asResponse(), 'refresh-plain');

      expect(res.cookieCalls).toHaveLength(1);
      const call = res.cookieCalls[0];
      expect(call?.name).toBe(REFRESH_TOKEN_COOKIE);
      expect(call?.options).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: 'example.test',
        path: '/auth',
      });
      expect(call?.options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('clearAuthCookies', () => {
    it('clears both cookies with matching paths and attributes', () => {
      const res = makeMockResponse();
      service.clearAuthCookies(res.asResponse());

      expect(res.clearCookieCalls).toHaveLength(2);
      const names = res.clearCookieCalls.map((c) => c.name);
      expect(names).toEqual([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]);
      expect(res.clearCookieCalls[0]?.options.path).toBe('/');
      expect(res.clearCookieCalls[1]?.options.path).toBe('/auth');
    });
  });

  describe('readRefreshToken', () => {
    it('returns the refresh cookie value', () => {
      const req = {
        cookies: { [REFRESH_TOKEN_COOKIE]: 'refresh-value' },
      } as unknown as Request;
      expect(service.readRefreshToken(req)).toBe('refresh-value');
    });

    it('returns null when missing or empty', () => {
      const empty = { cookies: {} } as unknown as Request;
      const noCookies = {} as unknown as Request;
      const blank = {
        cookies: { [REFRESH_TOKEN_COOKIE]: '' },
      } as unknown as Request;
      expect(service.readRefreshToken(empty)).toBeNull();
      expect(service.readRefreshToken(noCookies)).toBeNull();
      expect(service.readRefreshToken(blank)).toBeNull();
    });
  });
});
