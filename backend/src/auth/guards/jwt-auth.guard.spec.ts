import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CookiesService } from '../cookies.service';
import { TokensService } from '../tokens.service';
import type { AuthenticatedRequest } from '../types/authenticated-request';

interface MockExecutionContextSpec {
  request: Partial<AuthenticatedRequest>;
  handler: object;
  controller: object;
}

function makeContext(spec: MockExecutionContextSpec): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: <T>() => spec.request as T,
      getResponse: <T>() => ({}) as T,
      getNext: <T>() => ({}) as T,
    }),
    getHandler: () => spec.handler,
    getClass: () => spec.controller,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let cookies: jest.Mocked<Pick<CookiesService, 'readAccessToken'>>;
  let tokens: jest.Mocked<Pick<TokensService, 'verifyAccessToken'>>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    cookies = {
      readAccessToken: jest.fn(),
    };
    tokens = {
      verifyAccessToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: reflector },
        { provide: CookiesService, useValue: cookies },
        { provide: TokensService, useValue: tokens },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  it('returns true without checking cookies when the route is marked @Public', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeContext({ request: {}, handler: {}, controller: {} });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);

    expect(cookies.readAccessToken).not.toHaveBeenCalled();
    expect(tokens.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the access token is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    cookies.readAccessToken.mockReturnValue(null);
    const ctx = makeContext({ request: {}, handler: {}, controller: {} });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propagates UnauthorizedException from token verification', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    cookies.readAccessToken.mockReturnValue('bad-jwt');
    tokens.verifyAccessToken.mockRejectedValue(
      new UnauthorizedException('Invalid or expired access token'),
    );
    const ctx = makeContext({ request: {}, handler: {}, controller: {} });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the authenticated user to the request on success', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    cookies.readAccessToken.mockReturnValue('valid-jwt');
    tokens.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      email: 'a@b.c',
    });

    const request: Partial<AuthenticatedRequest> = {};
    const ctx = makeContext({ request, handler: {}, controller: {} });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', email: 'a@b.c' });
  });

  it('checks both handler and class metadata for @Public', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const handler = function noop(): void {};
    class TestController {}
    const ctx = makeContext({
      request: {},
      handler,
      controller: TestController,
    });

    await guard.canActivate(ctx);

    const callArgs = reflector.getAllAndOverride.mock.calls[0];
    expect(callArgs?.[0]).toBe('isPublic');
    expect(callArgs?.[1]).toEqual([handler, TestController]);
  });
});
