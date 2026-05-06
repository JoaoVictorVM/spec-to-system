import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Prisma, type Specification } from '@prisma/client';
import { SpecificationsService } from './specifications.service';
import { PrismaService } from '../prisma/prisma.service';

type SpecDelegateMock = {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
};

function makeSpec(overrides: Partial<Specification> = {}): Specification {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    sessionCode: 'abcdef',
    prompt: 'a prompt',
    response: 'a response',
    userId: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('SpecificationsService', () => {
  let service: SpecificationsService;
  let specDelegate: SpecDelegateMock;

  beforeEach(async () => {
    specDelegate = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    };
    const prismaMock = {
      specification: specDelegate,
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SpecificationsService);
  });

  describe('create', () => {
    it('persists with all fields and returns the created specification', async () => {
      const spec = makeSpec();
      specDelegate.create.mockResolvedValue(spec);

      const result = await service.create({
        userId: 'user-1',
        sessionCode: 'abcdef',
        prompt: 'a prompt',
        response: 'a response',
      });

      expect(specDelegate.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          sessionCode: 'abcdef',
          prompt: 'a prompt',
          response: 'a response',
        },
      });
      expect(result).toEqual(spec);
    });

    it('translates P2002 (sessionCode collision) into ConflictException', async () => {
      specDelegate.create.mockRejectedValue(makeUniqueConstraintError());

      await expect(
        service.create({
          userId: 'user-1',
          sessionCode: 'abcdef',
          prompt: 'p',
          response: 'r',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unknown errors unchanged', async () => {
      const unknown = new Error('boom');
      specDelegate.create.mockRejectedValue(unknown);

      await expect(
        service.create({
          userId: 'user-1',
          sessionCode: 'abcdef',
          prompt: 'p',
          response: 'r',
        }),
      ).rejects.toBe(unknown);
    });
  });

  describe('findByCode', () => {
    it('queries by sessionCode', async () => {
      specDelegate.findUnique.mockResolvedValue(null);

      await service.findByCode('abcdef');

      expect(specDelegate.findUnique).toHaveBeenCalledWith({
        where: { sessionCode: 'abcdef' },
      });
    });

    it('returns null when no specification exists', async () => {
      specDelegate.findUnique.mockResolvedValue(null);
      await expect(service.findByCode('nope12')).resolves.toBeNull();
    });

    it('returns the specification when found', async () => {
      const spec = makeSpec();
      specDelegate.findUnique.mockResolvedValue(spec);
      await expect(service.findByCode('abcdef')).resolves.toEqual(spec);
    });
  });

  describe('listForUser', () => {
    it('uses default limit when none is provided and returns all rows when fewer than limit+1', async () => {
      const items = [makeSpec({ id: 'a' }), makeSpec({ id: 'b' })];
      specDelegate.findMany.mockResolvedValue(items);

      const result = await service.listForUser({ userId: 'user-1' });

      expect(specDelegate.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 21, // default limit + 1
      });
      expect(result.items).toEqual(items);
      expect(result.nextCursor).toBeNull();
    });

    it('detects another page and returns the last item id as nextCursor', async () => {
      const rows = Array.from({ length: 4 }, (_, i) =>
        makeSpec({ id: `id-${String(i)}` }),
      );
      specDelegate.findMany.mockResolvedValue(rows);

      const result = await service.listForUser({ userId: 'user-1', limit: 3 });

      expect(specDelegate.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 4,
      });
      expect(result.items).toHaveLength(3);
      expect(result.nextCursor).toBe('id-2');
    });

    it('passes the cursor with skip:1 when paging', async () => {
      specDelegate.findMany.mockResolvedValue([]);

      await service.listForUser({
        userId: 'user-1',
        cursor: 'last-id',
        limit: 5,
      });

      expect(specDelegate.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        cursor: { id: 'last-id' },
        skip: 1,
      });
    });

    it('only returns items belonging to the requested user', async () => {
      specDelegate.findMany.mockResolvedValue([]);

      await service.listForUser({ userId: 'user-42' });

      type FindManyArgs = { where: { userId: string } };
      const calls = specDelegate.findMany.mock.calls as FindManyArgs[][];
      const args = calls[0]?.[0];
      expect(args).toBeDefined();
      if (!args) return;
      expect(args.where.userId).toBe('user-42');
    });
  });
});
