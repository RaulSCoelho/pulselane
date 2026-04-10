import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { SessionRepository } from './session.repository';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CookieService } from './cookie.service';
import { OrganizationModule } from '../organization/organization.module';
import { CryptoService } from '@/infra/crypto/crypto.service';
import { UserModule } from '../user/user.module';
import { MembershipModule } from '../membership/membership.module';

// The access-token guard is registered as an app guard here so every route is
// private by default and opt-outs stay explicit at the controller level.
@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UserModule,
    OrganizationModule,
    MembershipModule,
  ],
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
    RefreshTokenStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
