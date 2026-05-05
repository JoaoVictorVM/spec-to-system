import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HashingService } from '../auth/hashing.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser, type PublicUser } from './users.types';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly hashing: HashingService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() current: AuthenticatedUser): Promise<PublicUser> {
    const user = await this.users.findById(current.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    const passwordHash =
      dto.password !== undefined
        ? await this.hashing.hash(dto.password)
        : undefined;

    const updated = await this.users.update(current.id, {
      ...(dto.email !== undefined && { email: dto.email }),
      ...(passwordHash !== undefined && { passwordHash }),
    });

    return toPublicUser(updated);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() current: AuthenticatedUser): Promise<void> {
    await this.users.delete(current.id);
    // Refresh tokens cascade-delete via FK; the user's access token remains
    // valid until expiry (≤15min) — clients should call /auth/logout to clear
    // cookies immediately.
  }
}
