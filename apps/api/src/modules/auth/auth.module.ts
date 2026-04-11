import { CryptoService } from '@/infra/crypto/crypto.service'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { MembershipModule } from '../membership/membership.module'
import { OrganizationModule } from '../organization/organization.module'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CookieService } from './cookie.service'
import { AccessTokenGuard } from './guards/access-token.guard'
import { SessionRepository } from './session.repository'
import { SessionService } from './session.service'
import { AccessTokenStrategy } from './strategies/access-token.strategy'
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy'
import { TokenService } from './token.service'

// The access-token guard is registered as an app guard here so every route is
// private by default and opt-outs stay explicit at the controller level.
@Module({
  imports: [PassportModule, JwtModule.register({}), UserModule, OrganizationModule, MembershipModule],
  controllers: [AuthController],
  providers: [
    { provide: 'APP_GUARD', useClass: AccessTokenGuard },
    AuthService,
    SessionService,
    TokenService,
    CryptoService,
    CookieService,
    SessionRepository,
    AccessTokenStrategy,
    RefreshTokenStrategy
  ],
  exports: [AuthService]
})
export class AuthModule {}
