import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  ALLOWED_CORS_ORIGINS: Joi.string().allow('').default('*'),

  COOKIE_SECRET: Joi.string().required(),
  APP_COOKIE_DOMAIN: Joi.string().allow('', null).optional(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().positive().default(30),
});
