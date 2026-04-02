import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { MembershipRole } from '@prisma/client';
import { SignupDto } from './dto/requests/signup.dto';
import { LoginDto } from './dto/requests/login.dto';
import { OrganizationService } from '../organization/organization.service';
import { CryptoService } from '@/infra/crypto/crypto.service';
import { UserService } from '../user/user.service';
import { MembershipService } from '../membership/membership.service';
import { MeResponseDto } from './dto/responses/me-response.dto';

type SessionParams = {
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
};

type RotateParams = {
  userId: string;
  sessionId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly cryptoService: CryptoService,
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly membershipService: MembershipService,
  ) {}

  async signup(dto: SignupDto, params: SessionParams) {
    await this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(dto, tx);
      const organization = await this.organizationService.create(
        dto.organizationName,
        tx,
      );
      await this.membershipService.create(
        {
          userId: user.id,
          organizationId: organization.id,
          role: MembershipRole.owner,
        },
        tx,
      );
    });

    return this.login(
      {
        email: dto.email,
        password: dto.password,
      },
      {
        deviceId: params.deviceId,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
      },
    );
  }

  async login(dto: LoginDto, params: SessionParams) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.cryptoService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let session = await this.sessionService.upsert({
      userId: user.id,
      deviceId: params.deviceId,
      refreshToken: 'temp',
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    const refreshToken = await this.tokenService.signRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    const accessToken = await this.tokenService.signAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    session = await this.sessionService.upsert({
      userId: user.id,
      deviceId: session.deviceId,
      refreshToken,
    });

    return {
      session,
      accessToken,
      refreshToken,
    };
  }

  async me(userId: string): Promise<MeResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      memberships: user.memberships.map((membership) => ({
        userId: membership.userId,
        role: membership.role,
        organization: {
          name: membership.organization.name,
          slug: membership.organization.slug,
        },
      })),
    };
  }

  async rotate(params: RotateParams) {
    const newRefreshToken = await this.tokenService.signRefreshToken({
      userId: params.userId,
      sessionId: params.sessionId,
    });

    const session = await this.sessionService.rotate({
      userId: params.userId,
      sessionId: params.sessionId,
      refreshToken: params.refreshToken,
      newRefreshToken,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    const accessToken = await this.tokenService.signAccessToken({
      userId: params.userId,
      sessionId: params.sessionId,
    });

    return {
      session,
      accessToken,
      newRefreshToken,
    };
  }

  async logoutCurrentSession(userId: string, sessionId: string): Promise<void> {
    await this.sessionService.revokeById(sessionId, userId);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionService.revokeAllByUserId(userId);
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionService.findManyByUserId(userId);

    return sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastUsedAt: session.updatedAt,
      revokedAt: session.revokedAt,
      compromisedAt: session.compromisedAt,
      isCurrent: session.id === currentSessionId,
      isActive: !session.revokedAt && session.expiresAt > new Date(),
    }));
  }
}
