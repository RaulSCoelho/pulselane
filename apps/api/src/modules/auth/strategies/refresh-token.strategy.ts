import { EnvConfig } from '@/config/env.config'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'
import { Strategy } from 'passport-jwt'

import { DEVICE_COOKIE_NAME, REFRESH_COOKIE_NAME, REFRESH_TOKEN_STRATEGY } from '../auth.constants'
import { RefreshRequestUser } from '../contracts/refresh-request-user'
import { RefreshTokenPayload } from '../contracts/refresh-token-payload'

function extractRefreshToken(request: FastifyRequest): string | null {
  return request.cookies[REFRESH_COOKIE_NAME] ?? null
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, REFRESH_TOKEN_STRATEGY) {
  constructor(configService: ConfigService<EnvConfig, true>) {
    super({
      jwtFromRequest: extractRefreshToken,
      secretOrKey: configService.getOrThrow('jwtRefreshSecret', {
        infer: true
      }),
      ignoreExpiration: false,
      passReqToCallback: true
    })
  }

  validate(request: FastifyRequest, payload: RefreshTokenPayload): RefreshRequestUser {
    const refreshToken = extractRefreshToken(request)
    const deviceId = request.cookies[DEVICE_COOKIE_NAME]

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token')
    }

    if (!deviceId) {
      throw new UnauthorizedException('Missing device ID')
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid token type')
    }

    if (!payload.did) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    // The raw refresh token is preserved on request.user so AuthService can
    // compare it against the stored hash during rotation.
    return {
      ...payload,
      refreshToken,
      deviceId
    }
  }
}
