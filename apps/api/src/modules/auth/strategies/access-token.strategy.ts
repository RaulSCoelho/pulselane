import { EnvConfig } from '@/config/env.config'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { ACCESS_TOKEN_STRATEGY } from '../auth.constants'
import { AccessRequestUser } from '../contracts/access-request-user'
import { AccessTokenPayload } from '../contracts/access-token-payload'
import { SessionService } from '../session.service'

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, ACCESS_TOKEN_STRATEGY) {
  constructor(
    configService: ConfigService<EnvConfig, true>,
    private readonly sessionService: SessionService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('jwtAccessSecret', { infer: true }),
      ignoreExpiration: false
    })
  }

  async validate(payload: AccessTokenPayload): Promise<AccessRequestUser> {
    // A valid JWT is not enough on its own; the backing session must still be
    // active so logout and compromise flags take effect immediately.
    await this.sessionService.validateSession(payload.sub, payload.sid)
    return payload
  }
}
