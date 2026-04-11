import Joi from 'joi'

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  ALLOWED_CORS_ORIGINS: Joi.string().required(),

  DATABASE_URL: Joi.string().uri().required(),

  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('debug'),
  SLOW_REQUEST_THRESHOLD_MS: Joi.number().integer().positive().default(1000),

  RATE_LIMIT_TTL_MS: Joi.number().integer().positive().default(60_000),
  RATE_LIMIT_LIMIT: Joi.number().integer().positive().default(120),
  AUTH_RATE_LIMIT_TTL_MS: Joi.number().integer().positive().default(60_000),
  AUTH_RATE_LIMIT_LIMIT: Joi.number().integer().positive().default(5),

  COOKIE_SECRET: Joi.string().required(),
  COOKIE_SECURE: Joi.boolean().required(),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('', null).optional(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().positive().default(30),

  APP_WEB_URL: Joi.string().uri().required(),

  EMAIL_FROM_NAME: Joi.string().required(),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),
  EMAIL_TRANSPORT: Joi.string().valid('logger', 'smtp').default('logger'),
  EMAIL_SMTP_HOST: Joi.when('EMAIL_TRANSPORT', {
    is: 'smtp',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  EMAIL_SMTP_PORT: Joi.when('EMAIL_TRANSPORT', {
    is: 'smtp',
    then: Joi.number().integer().positive().required(),
    otherwise: Joi.number().integer().positive().optional()
  }),
  EMAIL_SMTP_SECURE: Joi.boolean().default(false),
  EMAIL_SMTP_USER: Joi.when('EMAIL_TRANSPORT', {
    is: 'smtp',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  EMAIL_SMTP_PASSWORD: Joi.when('EMAIL_TRANSPORT', {
    is: 'smtp',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  })
})
