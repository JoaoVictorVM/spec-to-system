import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CookiesService } from '../cookies.service';
import { TokensService } from '../tokens.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  type AuthenticatedRequest,
  payloadToAuthenticatedUser,
} from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: CookiesService,
    private readonly tokens: TokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.cookies.readAccessToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const payload = await this.tokens.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payloadToAuthenticatedUser(payload);
    return true;
  }
}
