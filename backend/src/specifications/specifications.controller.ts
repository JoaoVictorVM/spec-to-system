import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Specification } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { CreateSpecificationDto } from './dto/create-specification.dto';
import { SpecificationsService } from './specifications.service';

const ONE_MINUTE_MS = 60_000;
const POST_LIMIT_PER_MINUTE = 10;

@Controller('specifications')
export class SpecificationsController {
  constructor(private readonly specifications: SpecificationsService) {}

  @Throttle({ default: { limit: POST_LIMIT_PER_MINUTE, ttl: ONE_MINUTE_MS } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: CreateSpecificationDto,
  ): Promise<Specification> {
    return this.specifications.create({
      userId: current.id,
      sessionCode: dto.sessionCode,
      prompt: dto.prompt,
      response: dto.response,
    });
  }

  /**
   * Public: anyone with the unguessable sessionCode (nanoid 6) can read a
   * specification. Discoverability is bounded by the address space (~36^6).
   */
  @Public()
  @Get(':code')
  async findByCode(@Param('code') code: string): Promise<Specification> {
    const spec = await this.specifications.findByCode(code);
    if (!spec) {
      throw new NotFoundException('Specification not found');
    }
    return spec;
  }
}
