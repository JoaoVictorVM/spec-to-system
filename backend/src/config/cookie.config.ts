import { registerAs } from '@nestjs/config';

export type SameSite = 'lax' | 'strict' | 'none';

export interface CookieConfig {
  domain: string;
  secure: boolean;
  sameSite: SameSite;
}

export const cookieConfig = registerAs('cookie', (): CookieConfig => {
  const domain = process.env['COOKIE_DOMAIN'];
  const secureRaw = process.env['COOKIE_SECURE'];
  const sameSiteRaw = process.env['COOKIE_SAME_SITE'];

  if (!domain || secureRaw === undefined || !sameSiteRaw) {
    throw new Error(
      'Cookie env vars not loaded — check ConfigModule validation',
    );
  }

  if (
    sameSiteRaw !== 'lax' &&
    sameSiteRaw !== 'strict' &&
    sameSiteRaw !== 'none'
  ) {
    throw new Error(`Invalid COOKIE_SAME_SITE: ${sameSiteRaw}`);
  }

  return {
    domain,
    secure: secureRaw === 'true',
    sameSite: sameSiteRaw,
  };
});
