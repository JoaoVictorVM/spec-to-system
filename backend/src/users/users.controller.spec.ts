import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HashingService } from '../auth/hashing.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';

describe('UsersController', () => {
  let controller: UsersController;
  let users: jest.Mocked<Pick<UsersService, 'findById' | 'update' | 'delete'>>;
  let hashing: jest.Mocked<Pick<HashingService, 'hash' | 'compare'>>;

  const persistedUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'old-hash',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const currentUser: AuthenticatedUser = {
    id: persistedUser.id,
    email: persistedUser.email,
  };

  beforeEach(async () => {
    users = {
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    hashing = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: users },
        { provide: HashingService, useValue: hashing },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  describe('getMe', () => {
    it('returns the current user without passwordHash', async () => {
      users.findById.mockResolvedValue(persistedUser);

      const result = await controller.getMe(currentUser);

      expect(users.findById).toHaveBeenCalledWith(currentUser.id);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(persistedUser.id);
    });

    it('throws NotFoundException when the user has been deleted', async () => {
      users.findById.mockResolvedValue(null);

      await expect(controller.getMe(currentUser)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateMe', () => {
    it('updates only the email when password is omitted', async () => {
      users.update.mockResolvedValue(persistedUser);

      await controller.updateMe(currentUser, { email: 'new@example.com' });

      expect(hashing.hash).not.toHaveBeenCalled();
      expect(users.update).toHaveBeenCalledWith(currentUser.id, {
        email: 'new@example.com',
      });
    });

    it('hashes the password before persisting and never sends plain text', async () => {
      users.update.mockResolvedValue(persistedUser);
      hashing.hash.mockResolvedValue('new-hash');

      await controller.updateMe(currentUser, { password: 'newpass123' });

      expect(hashing.hash).toHaveBeenCalledWith('newpass123');
      expect(users.update).toHaveBeenCalledWith(currentUser.id, {
        passwordHash: 'new-hash',
      });
    });

    it('updates both fields when both are provided', async () => {
      users.update.mockResolvedValue(persistedUser);
      hashing.hash.mockResolvedValue('new-hash');

      await controller.updateMe(currentUser, {
        email: 'new@example.com',
        password: 'newpass123',
      });

      expect(users.update).toHaveBeenCalledWith(currentUser.id, {
        email: 'new@example.com',
        passwordHash: 'new-hash',
      });
    });

    it('returns the updated user without passwordHash', async () => {
      users.update.mockResolvedValue({
        ...persistedUser,
        email: 'new@example.com',
      });

      const result = await controller.updateMe(currentUser, {
        email: 'new@example.com',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('deleteMe', () => {
    it('deletes the current user', async () => {
      users.delete.mockResolvedValue();

      await controller.deleteMe(currentUser);

      expect(users.delete).toHaveBeenCalledWith(currentUser.id);
    });
  });
});
