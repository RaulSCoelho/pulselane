import { Auth } from '@/common/decorators/auth.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import { SuccessResponseDto } from '@/common/dto/success-response.dto'
import { Body, Controller, Get, HttpCode, Ip, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { DEVICE_COOKIE_NAME, REFRESH_COOKIE_NAME } from './auth.constants'
import { AuthService } from './auth.service'
import type { AccessRequestUser } from './contracts/access-request-user'
import type { RefreshRequestUser } from './contracts/refresh-request-user'
import { CookieService } from './cookie.service'
import { LoginDto } from './dto/requests/login.dto'
import { SignupDto } from './dto/requests/signup.dto'
import { AuthResponseDto } from './dto/responses/auth-response.dto'
import { MeResponseDto } from './dto/responses/me-response.dto'
import { SessionResponseDto } from './dto/responses/session-response.dto'
import { RefreshTokenGuard } from './guards/refresh-token.guard'

const signupThrottle = {
  auth: {
    limit: 3,
    ttl: 5 * 60_000
  }
}

const authThrottle = {
  auth: {
    limit: 5,
    ttl: 60_000
  }
}

@ApiTags('Auth')
@ApiCookieAuth(REFRESH_COOKIE_NAME)
@ApiCookieAuth(DEVICE_COOKIE_NAME)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService
  ) {}

  @Throttle(signupThrottle)
  @Auth({ mode: 'public' })
  @Post('signup')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create account and initial session',
    description: 'Creates a new user and organization, and initializes a session per device.'
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User created and authenticated successfully'
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already in use'
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'Too many signup attempts'
  })
  async signup(
    @Body() dto: SignupDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    const result = await this.authService.signup(dto, {
      deviceId: request.cookies[DEVICE_COOKIE_NAME],
      userAgent: request.headers['user-agent'],
      ipAddress
    })

    this.cookieService.setRefreshCookie(reply, result.refreshToken)
    this.cookieService.setDeviceCookie(reply, result.session.deviceId)

    return {
      accessToken: result.accessToken.token,
      expiresIn: result.accessToken.expiresIn
    }
  }

  @Throttle(authThrottle)
  @Auth({ mode: 'public' })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate user',
    description: 'Authenticates user credentials and creates a session per device.'
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'User authenticated successfully'
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid credentials'
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'Too many login attempts'
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, {
      deviceId: request.cookies[DEVICE_COOKIE_NAME],
      userAgent: request.headers['user-agent'],
      ipAddress
    })

    this.cookieService.setRefreshCookie(reply, result.refreshToken)
    this.cookieService.setDeviceCookie(reply, result.session.deviceId)

    return {
      accessToken: result.accessToken.token,
      expiresIn: result.accessToken.expiresIn
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the authenticated user with memberships and organizations.'
  })
  @ApiOkResponse({
    type: MeResponseDto,
    description: 'User data retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Unauthorized'
  })
  async me(@CurrentUser() user: AccessRequestUser): Promise<MeResponseDto> {
    return this.authService.me(user.sub)
  }

  @Throttle(authThrottle)
  @Auth({ mode: 'public' })
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using the refresh token stored in cookies.'
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Token refreshed successfully'
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid or expired refresh token'
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'Too many refresh attempts'
  })
  async refresh(
    @CurrentUser() user: RefreshRequestUser,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    if (!user?.sub || !user?.sid || !user?.deviceId || !user?.refreshToken) {
      throw new UnauthorizedException('Invalid session')
    }

    const result = await this.authService.rotate({
      userId: user.sub,
      sessionId: user.sid,
      deviceId: user.deviceId,
      refreshToken: user.refreshToken,
      userAgent: request.headers['user-agent'],
      ipAddress
    })

    this.cookieService.setRefreshCookie(reply, result.newRefreshToken)

    return {
      accessToken: result.accessToken.token,
      expiresIn: result.accessToken.expiresIn
    }
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current session',
    description: 'Invalidates the current device session.'
  })
  @ApiOkResponse({
    type: SuccessResponseDto
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Unauthorized'
  })
  async logout(@CurrentUser() user: AccessRequestUser, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.authService.logoutCurrentSession(user.sub, user.sid)

    this.cookieService.clearRefreshCookie(reply)

    return {
      success: true
    }
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revokes all sessions for the user.'
  })
  @ApiOkResponse({
    type: SuccessResponseDto
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Unauthorized'
  })
  async logoutAll(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    await this.authService.logoutAllSessions(userId)

    this.cookieService.clearRefreshCookie(reply)

    return {
      success: true
    }
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List user sessions',
    description: 'Returns all sessions associated with the user.'
  })
  @ApiOkResponse({
    type: SessionResponseDto,
    isArray: true
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Unauthorized'
  })
  async listSessions(@CurrentUser() user: AccessRequestUser): Promise<SessionResponseDto[]> {
    return this.authService.listSessions(user.sub, user.sid)
  }
}
