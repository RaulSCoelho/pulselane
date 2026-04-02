import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { SessionRepository } from './domain/session.repository';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: 'APP_GUARD', useClass: AccessTokenGuard },
    AuthService,
    SessionService,
    TokenService,
    SessionRepository,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
