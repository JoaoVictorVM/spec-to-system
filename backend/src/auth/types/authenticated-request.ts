import type { Request } from 'express';
import type { AccessTokenPayload } from '../tokens.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export function payloadToAuthenticatedUser(
  payload: AccessTokenPayload,
): AuthenticatedUser {
  return { id: payload.sub, email: payload.email };
}
