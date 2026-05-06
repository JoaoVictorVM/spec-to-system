import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { Specification } from '@prisma/client';
import { SpecificationsController } from './specifications.controller';
import { SpecificationsService } from './specifications.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';

describe('SpecificationsController', () => {
  let controller: SpecificationsController;
  let service: jest.Mocked<
    Pick<SpecificationsService, 'create' | 'findByCode' | 'listForUser'>
  >;

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@example.com',
  };

  const persistedSpec: Specification = {
    id: '11111111-1111-1111-1111-111111111111',
    sessionCode: 'aB3_-x',
    prompt: 'Build a chat app',
    response: '## Visão Geral\n...',
    userId: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findByCode: jest.fn(),
      listForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecificationsController],
      providers: [{ provide: SpecificationsService, useValue: service }],
    }).compile();

    controller = module.get(SpecificationsController);
  });

  describe('create', () => {
    it('forwards the dto fields plus the current user id to the service', async () => {
      service.create.mockResolvedValue(persistedSpec);

      await controller.create(currentUser, {
        sessionCode: 'aB3_-x',
        prompt: 'Build a chat app',
        response: '## Visão Geral\n...',
      });

      expect(service.create).toHaveBeenCalledWith({
        userId: currentUser.id,
        sessionCode: 'aB3_-x',
        prompt: 'Build a chat app',
        response: '## Visão Geral\n...',
      });
    });

    it('returns the created specification', async () => {
      service.create.mockResolvedValue(persistedSpec);

      const result = await controller.create(currentUser, {
        sessionCode: 'aB3_-x',
        prompt: 'p',
        response: 'r',
      });

      expect(result).toEqual(persistedSpec);
    });
  });

  describe('findByCode', () => {
    it('returns the specification when found', async () => {
      service.findByCode.mockResolvedValue(persistedSpec);

      const result = await controller.findByCode('aB3_-x');

      expect(service.findByCode).toHaveBeenCalledWith('aB3_-x');
      expect(result).toEqual(persistedSpec);
    });

    it('throws NotFoundException when no specification matches', async () => {
      service.findByCode.mockResolvedValue(null);

      await expect(controller.findByCode('nope12')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listMine', () => {
    it('forwards the current user id and the query params to the service', async () => {
      service.listForUser.mockResolvedValue({ items: [], nextCursor: null });

      await controller.listMine(currentUser, {
        cursor: '11111111-1111-4111-8111-111111111111',
        limit: 50,
      });

      expect(service.listForUser).toHaveBeenCalledWith({
        userId: currentUser.id,
        cursor: '11111111-1111-4111-8111-111111111111',
        limit: 50,
      });
    });

    it('passes undefined cursor and limit when not provided', async () => {
      service.listForUser.mockResolvedValue({ items: [], nextCursor: null });

      await controller.listMine(currentUser, {});

      expect(service.listForUser).toHaveBeenCalledWith({
        userId: currentUser.id,
        cursor: undefined,
        limit: undefined,
      });
    });

    it('returns the paginated result from the service', async () => {
      const expected = { items: [persistedSpec], nextCursor: 'next-id' };
      service.listForUser.mockResolvedValue(expected);

      await expect(controller.listMine(currentUser, {})).resolves.toEqual(
        expected,
      );
    });
  });
});
