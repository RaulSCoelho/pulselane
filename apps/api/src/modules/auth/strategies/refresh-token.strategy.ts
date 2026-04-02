import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';

import { REFRESH_COOKIE_NAME } from '../infra/auth.constants';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload } from '../contracts/refresh-token-payload';

function extractRefreshToken(request: FastifyRequest): string | null {
  return request.cookies[REFRESH_COOKIE_NAME] ?? null;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractRefreshToken,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: RefreshTokenPayload) {
    return payload;
  }
}
