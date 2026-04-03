import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  ALLOWED_CORS_ORIGINS: Joi.string().allow('').default('*'),

  COOKIE_SECRET: Joi.string().required(),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('', null).optional(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().positive().default(30),
});
