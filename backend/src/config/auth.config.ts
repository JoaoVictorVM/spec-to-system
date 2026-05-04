import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  accessSecret: string;
  accessExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export const authConfig = registerAs('auth', (): AuthConfig => {
  const accessSecret = process.env['JWT_ACCESS_SECRET'];
  const accessExpiresIn = process.env['JWT_ACCESS_EXPIRES_IN'];
  const refreshSecret = process.env['JWT_REFRESH_SECRET'];
  const refreshExpiresIn = process.env['JWT_REFRESH_EXPIRES_IN'];

  if (
    !accessSecret ||
    !refreshSecret ||
    !accessExpiresIn ||
    !refreshExpiresIn
  ) {
    throw new Error('Auth env vars not loaded — check ConfigModule validation');
  }

  return { accessSecret, accessExpiresIn, refreshSecret, refreshExpiresIn };
});
