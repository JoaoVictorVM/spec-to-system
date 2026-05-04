import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().integer().positive().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  COOKIE_DOMAIN: Joi.string().default('localhost'),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  CORS_ORIGIN: Joi.string().uri().required(),
}).custom((value: Record<string, unknown>) => {
  if (value['JWT_ACCESS_SECRET'] === value['JWT_REFRESH_SECRET']) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values',
    );
  }
  return value;
});
