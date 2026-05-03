import Joi from 'joi'

import { parseTrustProxy } from './env.config'

function validateTrustProxy(value: unknown, helpers: Joi.CustomHelpers): string | Joi.ErrorReport {
  if (typeof value !== 'string') {
    return helpers.error('string.base')
  }

  try {
    parseTrustProxy(value)
    return value
  } catch (error) {
    return helpers.error('any.invalid', { message: error instanceof Error ? error.message : 'Invalid TRUST_PROXY' })
  }
}

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  ALLOWED_CORS_ORIGINS: Joi.string()
    .trim()
    .pattern(/^(\*|(\.[a-z0-9.-]+)|(https?:\/\/[^,\s]+)(\s*,\s*https?:\/\/[^,\s]+)*)$/i)
    .required(),
  TRUST_PROXY: Joi.string().trim().custom(validateTrustProxy).default('false'),

  DATABASE_URL: Joi.string().uri().required(),

  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('debug'),
  SLOW_REQUEST_THRESHOLD_MS: Joi.number().integer().positive().default(1000),
  METRICS_BEARER_TOKEN: Joi.string().trim().min(32).required(),

  SENTRY_ENABLED: Joi.boolean().default(false),
  SENTRY_DSN: Joi.when('SENTRY_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null).optional()
  }),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  SENTRY_RELEASE: Joi.string().allow('', null).optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0),

  THROTTLING_ENABLED: Joi.boolean().optional(),
  RATE_LIMIT_TTL_MS: Joi.number().integer().positive().default(60_000),
  RATE_LIMIT_LIMIT: Joi.number().integer().positive().default(120),

  COOKIE_SECRET: Joi.string().required(),
  COOKIE_SECURE: Joi.boolean().required(),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('', null).optional(),
  AUTH_COOKIE_PATH: Joi.string().trim().default('/api/v1/auth'),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().positive().default(30),

  APP_WEB_URL: Joi.string().uri().required(),

  EMAIL_FROM_NAME: Joi.string().required(),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),
  EMAIL_TRANSPORT: Joi.string().valid('logger', 'smtp').default('logger'),
  EMAIL_QUEUE_DRAIN_DELAY_MS: Joi.number().integer().positive().default(30_000),
  EMAIL_QUEUE_STALLED_INTERVAL_MS: Joi.number().integer().positive().default(120_000),
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
  }),

  STRIPE_ENABLED: Joi.boolean().default(false),
  STRIPE_SECRET_KEY: Joi.when('STRIPE_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null).optional()
  }),
  STRIPE_WEBHOOK_SECRET: Joi.when('STRIPE_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null).optional()
  }),
  STRIPE_PRICE_STARTER: Joi.when('STRIPE_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null).optional()
  }),
  STRIPE_PRICE_GROWTH: Joi.when('STRIPE_ENABLED', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null).optional()
  }),

  REDIS_ENABLED: Joi.boolean().default(false),
  REDIS_REQUIRED: Joi.boolean().default(false),
  REDIS_URL: Joi.when('REDIS_ENABLED', {
    is: true,
    then: Joi.string().uri().required(),
    otherwise: Joi.string().allow('', null).optional()
  })
})
