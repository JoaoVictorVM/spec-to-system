import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type Specification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_LIST_LIMIT } from './dto/list-specifications-query.dto';

export interface CreateSpecificationInput {
  userId: string;
  sessionCode: string;
  prompt: string;
  response: string;
}

export interface ListSpecificationsInput {
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface ListSpecificationsResult {
  items: Specification[];
  nextCursor: string | null;
}

@Injectable()
export class SpecificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSpecificationInput): Promise<Specification> {
    try {
      return await this.prisma.specification.create({
        data: {
          userId: input.userId,
          sessionCode: input.sessionCode,
          prompt: input.prompt,
          response: input.response,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('sessionCode already exists');
      }
      throw error;
    }
  }

  findByCode(sessionCode: string): Promise<Specification | null> {
    return this.prisma.specification.findUnique({ where: { sessionCode } });
  }

  /**
   * Cursor-based pagination ordered by createdAt DESC (newest first).
   * Fetches `limit + 1` rows to detect whether a next page exists.
   */
  async listForUser(
    input: ListSpecificationsInput,
  ): Promise<ListSpecificationsResult> {
    const limit = input.limit ?? DEFAULT_LIST_LIMIT;

    const rows = await this.prisma.specification.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(input.cursor !== undefined && {
        cursor: { id: input.cursor },
        skip: 1,
      }),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
  }
}
