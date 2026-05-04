import { createHash, randomBytes } from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { authConfig } from '../config/auth.config';
import { PrismaService } from '../prisma/prisma.service';

const REFRESH_TOKEN_BYTES = 48;

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface IssuedRefreshToken {
  plain: string;
  expiresAt: Date;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    private readonly prisma: PrismaService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.auth.accessSecret,
      expiresIn: this.auth.accessExpiresIn as ms.StringValue,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const decoded = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.auth.accessSecret,
      });
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async issueRefreshToken(userId: string): Promise<IssuedRefreshToken> {
    const plain = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashRefreshToken(plain);
    const expiresAt = this.computeRefreshExpiry();

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { plain, expiresAt };
  }

  hashRefreshToken(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }

  private computeRefreshExpiry(): Date {
    const durationMs = ms(this.auth.refreshExpiresIn as ms.StringValue);
    if (typeof durationMs !== 'number' || durationMs <= 0) {
      throw new Error(
        `Invalid JWT_REFRESH_EXPIRES_IN: ${this.auth.refreshExpiresIn}`,
      );
    }
    return new Date(Date.now() + durationMs);
  }
}
