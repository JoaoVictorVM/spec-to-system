import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { HashingService } from './hashing.service';
import { TokensService } from './tokens.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<
    Pick<UsersService, 'create' | 'findByEmail' | 'findById'>
  >;
  let hashing: jest.Mocked<Pick<HashingService, 'hash' | 'compare'>>;
  let tokens: jest.Mocked<
    Pick<
      TokensService,
      'signAccessToken' | 'issueRefreshToken' | 'rotateRefreshToken'
    >
  >;

  const persistedUser: User = {
    id: 'user-id-1',
    email: 'user@example.com',
    passwordHash: 'bcrypt-hash',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    users = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    hashing = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    tokens = {
      signAccessToken: jest.fn(),
      issueRefreshToken: jest.fn(),
      rotateRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: HashingService, useValue: hashing },
        { provide: TokensService, useValue: tokens },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('hashes the password before persisting and returns a public user', async () => {
      hashing.hash.mockResolvedValue('bcrypt-hash');
      users.create.mockResolvedValue(persistedUser);

      const result = await service.register({
        email: 'user@example.com',
        password: 'plain-password-123',
      });

      expect(hashing.hash).toHaveBeenCalledWith('plain-password-123');
      expect(users.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        passwordHash: 'bcrypt-hash',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('never persists the plain password', async () => {
      hashing.hash.mockResolvedValue('bcrypt-hash');
      users.create.mockResolvedValue(persistedUser);

      await service.register({
        email: 'user@example.com',
        password: 'plain-password-123',
      });

      const createArg = users.create.mock.calls[0]?.[0];
      expect(createArg?.passwordHash).not.toBe('plain-password-123');
    });

    it('propagates ConflictException from UsersService when email is taken', async () => {
      hashing.hash.mockResolvedValue('bcrypt-hash');
      users.create.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        service.register({ email: 'taken@example.com', password: 'pw-123456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns access token, refresh token and public user on success', async () => {
      users.findByEmail.mockResolvedValue(persistedUser);
      hashing.compare.mockResolvedValue(true);
      tokens.signAccessToken.mockResolvedValue('access-jwt');
      tokens.issueRefreshToken.mockResolvedValue({
        plain: 'refresh-plain',
        expiresAt: new Date(),
      });

      const result = await service.login({
        email: 'user@example.com',
        password: 'plain-password-123',
      });

      expect(result.accessToken).toBe('access-jwt');
      expect(result.refreshToken).toBe('refresh-plain');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(tokens.signAccessToken).toHaveBeenCalledWith({
        sub: persistedUser.id,
        email: persistedUser.email,
      });
      expect(tokens.issueRefreshToken).toHaveBeenCalledWith(persistedUser.id);
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      users.findByEmail.mockResolvedValue(null);
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'nope@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('still calls bcrypt.compare for unknown email (timing mitigation)', async () => {
      users.findByEmail.mockResolvedValue(null);
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'nope@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(hashing.compare).toHaveBeenCalledTimes(1);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      users.findByEmail.mockResolvedValue(persistedUser);
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('does not issue tokens when credentials are invalid', async () => {
      users.findByEmail.mockResolvedValue(persistedUser);
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'bad' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(tokens.signAccessToken).not.toHaveBeenCalled();
      expect(tokens.issueRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const rotated = {
      userId: persistedUser.id,
      email: persistedUser.email,
      accessToken: 'new-access',
      refresh: { plain: 'new-refresh', expiresAt: new Date() },
    };

    it('rotates the refresh token and returns new tokens with the public user', async () => {
      tokens.rotateRefreshToken.mockResolvedValue(rotated);
      users.findById.mockResolvedValue(persistedUser);

      const result = await service.refresh('old-refresh');

      expect(tokens.rotateRefreshToken).toHaveBeenCalledWith('old-refresh');
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException when the user has been deleted', async () => {
      tokens.rotateRefreshToken.mockResolvedValue(rotated);
      users.findById.mockResolvedValue(null);

      await expect(service.refresh('old-refresh')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('propagates UnauthorizedException from token rotation', async () => {
      tokens.rotateRefreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(service.refresh('bad-refresh')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
