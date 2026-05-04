import type { User } from '@prisma/client';
import { toPublicUser } from './users.types';

describe('toPublicUser', () => {
  const fullUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'super-secret-hash',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('strips passwordHash from the returned object', () => {
    const result = toPublicUser(fullUser);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('preserves all other fields', () => {
    const result = toPublicUser(fullUser);
    expect(result).toEqual({
      id: fullUser.id,
      email: fullUser.email,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    });
  });

  it('does not mutate the input', () => {
    const clone: User = { ...fullUser };
    toPublicUser(fullUser);
    expect(fullUser).toEqual(clone);
  });
});
