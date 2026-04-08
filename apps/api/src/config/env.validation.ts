import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  ALLOWED_CORS_ORIGINS: Joi.string().required(),

  DATABASE_URL: Joi.string().uri().required(),

  COOKIE_SECRET: Joi.string().required(),
  COOKIE_SECURE: Joi.boolean().required(),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('', null).optional(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(900), // 15 minutes
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().positive().default(30),

  APP_WEB_URL: Joi.string().uri().required(),

  // Email delivery starts with a logger transport so the feature works before a
  // real provider such as Resend or SES is plugged in.
  EMAIL_FROM_NAME: Joi.string().required(),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),
  EMAIL_TRANSPORT: Joi.string().valid('logger').default('logger'),
});
