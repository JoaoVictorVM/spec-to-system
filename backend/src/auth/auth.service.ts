import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { toPublicUser, type PublicUser } from '../users/users.types';
import { HashingService } from './hashing.service';
import { TokensService } from './tokens.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hashing: HashingService,
    private readonly tokens: TokensService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const passwordHash = await this.hashing.hash(dto.password);
    const user = await this.users.create({ email: dto.email, passwordHash });
    return toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.users.findByEmail(dto.email);

    // Always run bcrypt.compare even when the user does not exist, to mitigate
    // user-enumeration via response timing.
    const dummyHash =
      '$2b$12$0000000000000000000000000000000000000000000000000000';
    const passwordOk = user
      ? await this.hashing.compare(dto.password, user.passwordHash)
      : (await this.hashing.compare(dto.password, dummyHash), false);

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    const refresh = await this.tokens.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: refresh.plain,
      user: toPublicUser(user),
    };
  }
}
