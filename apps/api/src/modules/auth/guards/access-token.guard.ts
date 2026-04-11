import { AUTH_OPTIONS_KEY, type AuthOptions } from '@/common/decorators/auth.decorator'
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { ACCESS_TOKEN_STRATEGY } from '../auth.constants'

@Injectable()
export class AccessTokenGuard extends AuthGuard(ACCESS_TOKEN_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const authOptions = this.getAuthOptions(context)

    // Public routes bypass Passport entirely; optional routes still execute the
    // strategy so request.user can be populated when credentials are present.
    if (authOptions.mode === 'public') {
      return true
    }

    return super.canActivate(context)
  }

  handleRequest<TUser = any>(err: any, user: TUser | false, _info: any, context: ExecutionContext): TUser {
    const authOptions = this.getAuthOptions(context)

    if (authOptions.mode === 'optional') {
      return (user || undefined) as TUser
    }

    if (err || !user) {
      throw err || new UnauthorizedException()
    }

    return user
  }

  private getAuthOptions(context: ExecutionContext): Required<AuthOptions> {
    const authOptions = this.reflector.getAllAndOverride<AuthOptions>(AUTH_OPTIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    return {
      mode: authOptions?.mode ?? 'private'
    }
  }
}
