import { Test, type TestingModule } from '@nestjs/testing';
import type { Specification } from '@prisma/client';
import { SpecificationsController } from './specifications.controller';
import { SpecificationsService } from './specifications.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';

describe('SpecificationsController', () => {
  let controller: SpecificationsController;
  let service: jest.Mocked<Pick<SpecificationsService, 'create'>>;

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
    service = { create: jest.fn() };

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
});
