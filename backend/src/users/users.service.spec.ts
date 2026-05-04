import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

type UserDelegateMock = {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const mockUser: User = {
  id: 'user-id-1',
  email: 'user@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function makeUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

function makeRecordNotFoundError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('UsersService', () => {
  let service: UsersService;
  let userDelegate: UserDelegateMock;

  beforeEach(async () => {
    userDelegate = {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const prismaMock = { user: userDelegate } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('create', () => {
    it('lowercases the email before persisting', async () => {
      userDelegate.create.mockResolvedValue(mockUser);

      await service.create({ email: 'USER@Example.COM', passwordHash: 'hash' });

      expect(userDelegate.create).toHaveBeenCalledWith({
        data: { email: 'user@example.com', passwordHash: 'hash' },
      });
    });

    it('returns the created user', async () => {
      userDelegate.create.mockResolvedValue(mockUser);

      await expect(
        service.create({ email: 'user@example.com', passwordHash: 'hash' }),
      ).resolves.toEqual(mockUser);
    });

    it('throws ConflictException when the email is already taken', async () => {
      userDelegate.create.mockRejectedValue(makeUniqueConstraintError());

      await expect(
        service.create({ email: 'user@example.com', passwordHash: 'hash' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unknown errors unchanged', async () => {
      const unknown = new Error('boom');
      userDelegate.create.mockRejectedValue(unknown);

      await expect(
        service.create({ email: 'user@example.com', passwordHash: 'hash' }),
      ).rejects.toBe(unknown);
    });
  });

  describe('findByEmail', () => {
    it('lowercases the email before querying', async () => {
      userDelegate.findUnique.mockResolvedValue(null);

      await service.findByEmail('USER@Example.COM');

      expect(userDelegate.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('returns null when no user exists', async () => {
      userDelegate.findUnique.mockResolvedValue(null);

      await expect(service.findByEmail('nope@example.com')).resolves.toBeNull();
    });

    it('returns the user when found', async () => {
      userDelegate.findUnique.mockResolvedValue(mockUser);

      await expect(service.findByEmail('user@example.com')).resolves.toEqual(
        mockUser,
      );
    });
  });

  describe('findById', () => {
    it('queries by id', async () => {
      userDelegate.findUnique.mockResolvedValue(mockUser);

      await service.findById('user-id-1');

      expect(userDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
    });
  });

  describe('update', () => {
    it('only sends the fields provided', async () => {
      userDelegate.update.mockResolvedValue(mockUser);

      await service.update('user-id-1', { email: 'NEW@Example.COM' });

      expect(userDelegate.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { email: 'new@example.com' },
      });
    });

    it('translates P2002 into ConflictException', async () => {
      userDelegate.update.mockRejectedValue(makeUniqueConstraintError());

      await expect(
        service.update('user-id-1', { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('translates P2025 into NotFoundException', async () => {
      userDelegate.update.mockRejectedValue(makeRecordNotFoundError());

      await expect(
        service.update('missing', { email: 'x@y.z' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the user by id', async () => {
      userDelegate.delete.mockResolvedValue(mockUser);

      await service.delete('user-id-1');

      expect(userDelegate.delete).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
    });

    it('translates P2025 into NotFoundException', async () => {
      userDelegate.delete.mockRejectedValue(makeRecordNotFoundError());

      await expect(service.delete('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
