import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from '../contracts/access-token-payload';
import { SessionService } from '../session.service';
import { ACCESS_TOKEN_STRATEGY } from '../infra/auth.constants';
import { EnvConfig } from '@/config/env.config';
import { AccessRequestUser } from '../contracts/access-request-user';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  ACCESS_TOKEN_STRATEGY,
) {
  constructor(
    configService: ConfigService<EnvConfig, true>,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('jwtAccessSecret', { infer: true }),
      ignoreExpiration: false,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AccessRequestUser> {
    // A valid JWT is not enough on its own; the backing session must still be
    // active so logout and compromise flags take effect immediately.
    await this.sessionService.validateSession(payload.sub, payload.sid);
    return payload;
  }
}
