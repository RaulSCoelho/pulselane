import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';

import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_STRATEGY,
} from '../infra/auth.constants';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload } from '../contracts/refresh-token-payload';
import { EnvConfig } from '@/config/env.config';

function extractRefreshToken(request: FastifyRequest): string | null {
  return request.cookies[REFRESH_COOKIE_NAME] ?? null;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  REFRESH_TOKEN_STRATEGY,
) {
  constructor(configService: ConfigService<EnvConfig>) {
    super({
      jwtFromRequest: extractRefreshToken,
      secretOrKey: configService.getOrThrow('jwtRefreshSecret'),
      ignoreExpiration: false,
    });
  }

  validate(payload: RefreshTokenPayload) {
    return payload;
  }
}
