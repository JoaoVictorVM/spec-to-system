import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  corsOrigin: string;
}

export const appConfig = registerAs('app', (): AppConfig => {
  const portRaw = process.env['PORT'];
  const nodeEnvRaw = process.env['NODE_ENV'];
  const corsOrigin = process.env['CORS_ORIGIN'];

  if (!portRaw || !nodeEnvRaw || !corsOrigin) {
    throw new Error('App env vars not loaded — check ConfigModule validation');
  }

  if (
    nodeEnvRaw !== 'development' &&
    nodeEnvRaw !== 'test' &&
    nodeEnvRaw !== 'production'
  ) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnvRaw}`);
  }

  return {
    port: Number(portRaw),
    nodeEnv: nodeEnvRaw,
    corsOrigin,
  };
});
