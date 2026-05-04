import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { HashingService } from './hashing.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'create' | 'findByEmail'>>;
  let hashing: jest.Mocked<Pick<HashingService, 'hash' | 'compare'>>;

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
    };
    hashing = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: HashingService, useValue: hashing },
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
      expect(result).toEqual({
        id: persistedUser.id,
        email: persistedUser.email,
        createdAt: persistedUser.createdAt,
        updatedAt: persistedUser.updatedAt,
      });
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
      expect(createArg?.passwordHash).toBe('bcrypt-hash');
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
});
