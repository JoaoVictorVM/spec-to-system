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

export interface RotatedTokens {
  userId: string;
  email: string;
  accessToken: string;
  refresh: IssuedRefreshToken;
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
      return await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.auth.accessSecret,
      });
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

  async rotateRefreshToken(plain: string): Promise<RotatedTokens> {
    const tokenHash = this.hashRefreshToken(plain);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newPlain = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const newTokenHash = this.hashRefreshToken(newPlain);
    const newExpiresAt = this.computeRefreshExpiry();

    // Atomic: mark old token as revoked AND create new one. Prevents replay.
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const accessToken = await this.signAccessToken({
      sub: stored.userId,
      email: stored.user.email,
    });

    return {
      userId: stored.userId,
      email: stored.user.email,
      accessToken,
      refresh: { plain: newPlain, expiresAt: newExpiresAt },
    };
  }

  /**
   * Marks a refresh token as revoked. Idempotent: silently no-ops if the token
   * is unknown or already revoked, so logout is always safe to retry.
   */
  async revokeRefreshToken(plain: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(plain);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
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
