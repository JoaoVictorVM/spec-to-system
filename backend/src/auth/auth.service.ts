import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { toPublicUser, type PublicUser } from '../users/users.types';
import { HashingService } from './hashing.service';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hashing: HashingService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const passwordHash = await this.hashing.hash(dto.password);
    const user = await this.users.create({ email: dto.email, passwordHash });
    return toPublicUser(user);
  }
}
