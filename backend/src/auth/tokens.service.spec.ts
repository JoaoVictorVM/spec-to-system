import { createHash } from 'crypto';
import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from './tokens.service';
import { authConfig } from '../config/auth.config';
import { PrismaService } from '../prisma/prisma.service';

describe('TokensService', () => {
  let service: TokensService;
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;
  type RefreshCreateArgs = {
    data: { userId: string; tokenHash: string; expiresAt: Date };
  };
  let refreshDelegate: {
    create: jest.Mock<Promise<unknown>, [RefreshCreateArgs]>;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  let prismaMock: PrismaService;

  const fakeAuthConfig = {
    accessSecret: 'access-secret-value',
    accessExpiresIn: '15m',
    refreshSecret: 'refresh-secret-value',
    refreshExpiresIn: '7d',
  };

  beforeEach(async () => {
    jwt = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    refreshDelegate = {
      create: jest.fn<Promise<unknown>, [RefreshCreateArgs]>(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    };
    prismaMock = {
      refreshToken: refreshDelegate,
      $transaction: jest.fn(async (ops: Promise<unknown>[]) =>
        Promise.all(ops),
      ),
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        { provide: JwtService, useValue: jwt },
        { provide: authConfig.KEY, useValue: fakeAuthConfig },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(TokensService);
  });

  describe('signAccessToken', () => {
    it('signs with the access secret and configured expiry', async () => {
      jwt.signAsync.mockResolvedValue('jwt-token');

      const token = await service.signAccessToken({
        sub: 'u1',
        email: 'a@b.c',
      });

      expect(token).toBe('jwt-token');
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: 'u1', email: 'a@b.c' },
        { secret: 'access-secret-value', expiresIn: '15m' },
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the payload on success', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'a@b.c' });

      await expect(service.verifyAccessToken('valid')).resolves.toEqual({
        sub: 'u1',
        email: 'a@b.c',
      });
    });

    it('throws UnauthorizedException on a bad token', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.verifyAccessToken('bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('hashRefreshToken', () => {
    it('returns the sha256 hex digest of the plain token', () => {
      const plain = 'opaque-token-value';
      const expected = createHash('sha256').update(plain).digest('hex');
      expect(service.hashRefreshToken(plain)).toBe(expected);
    });
  });

  describe('issueRefreshToken', () => {
    it('persists the hash (never the plain token) with userId and expiry', async () => {
      refreshDelegate.create.mockResolvedValue({});

      const issued = await service.issueRefreshToken('user-1');

      expect(issued.plain.length).toBeGreaterThan(0);
      expect(refreshDelegate.create).toHaveBeenCalledTimes(1);

      const args = refreshDelegate.create.mock.calls[0]?.[0];
      expect(args).toBeDefined();
      if (!args) return;
      expect(args.data.userId).toBe('user-1');
      expect(args.data.tokenHash).not.toBe(issued.plain);
      expect(args.data.tokenHash).toBe(service.hashRefreshToken(issued.plain));
      expect(args.data.expiresAt).toBeInstanceOf(Date);
      expect(args.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('produces different plain tokens on consecutive calls', async () => {
      refreshDelegate.create.mockResolvedValue({});
      const a = await service.issueRefreshToken('user-1');
      const b = await service.issueRefreshToken('user-1');
      expect(a.plain).not.toBe(b.plain);
    });

    it('sets expiresAt roughly 7 days in the future when configured to 7d', async () => {
      refreshDelegate.create.mockResolvedValue({});
      const before = Date.now();
      const issued = await service.issueRefreshToken('user-1');
      const after = Date.now();

      const expectedMin = before + 7 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 7 * 24 * 60 * 60 * 1000;
      expect(issued.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(issued.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('rotateRefreshToken', () => {
    const validStored = {
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'sha256-of-old',
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null as Date | null,
      createdAt: new Date(),
      user: { id: 'user-1', email: 'user@example.com' },
    };

    it('throws UnauthorizedException when the token is not found', async () => {
      refreshDelegate.findUnique.mockResolvedValue(null);

      await expect(
        service.rotateRefreshToken('unknown-plain'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the token is revoked', async () => {
      refreshDelegate.findUnique.mockResolvedValue({
        ...validStored,
        revokedAt: new Date(),
      });

      await expect(
        service.rotateRefreshToken('revoked-plain'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the token is expired', async () => {
      refreshDelegate.findUnique.mockResolvedValue({
        ...validStored,
        expiresAt: new Date(Date.now() - 1),
      });

      await expect(
        service.rotateRefreshToken('expired-plain'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('revokes the old token and issues a new pair on success', async () => {
      refreshDelegate.findUnique.mockResolvedValue(validStored);
      refreshDelegate.update.mockResolvedValue({});
      refreshDelegate.create.mockResolvedValue({});
      jwt.signAsync.mockResolvedValue('new-access-jwt');

      const result = await service.rotateRefreshToken('old-plain');

      expect(result.userId).toBe('user-1');
      expect(result.email).toBe('user@example.com');
      expect(result.accessToken).toBe('new-access-jwt');
      expect(result.refresh.plain.length).toBeGreaterThan(0);
      expect(result.refresh.plain).not.toBe('old-plain');

      // $transaction was used to revoke + create atomically
      const txMock = (prismaMock as unknown as { $transaction: jest.Mock })
        .$transaction;
      expect(txMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeRefreshToken', () => {
    it('marks the matching token as revoked', async () => {
      refreshDelegate.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeRefreshToken('plain-value');

      expect(refreshDelegate.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: service.hashRefreshToken('plain-value'),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) as Date },
      });
    });

    it('is idempotent — does not throw when no token matches', async () => {
      refreshDelegate.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.revokeRefreshToken('unknown'),
      ).resolves.toBeUndefined();
    });
  });
});
