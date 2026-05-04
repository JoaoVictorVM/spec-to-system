import type { User } from '@prisma/client';

/**
 * Public user shape — never exposes passwordHash.
 * Use this as the return type for any user data leaving the backend.
 */
export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...rest } = user;
  return rest;
}
