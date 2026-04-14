import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { UsagePolicyService } from '@/modules/billing/usage-policy.service'
import { EmailService } from '@/modules/email/email.service'
import { MembershipService } from '@/modules/membership/membership.service'
import { UserService } from '@/modules/user/user.service'
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import {
  AuditLogAction,
  MembershipRole,
  OrganizationInvitation,
  OrganizationInvitationStatus,
  Prisma
} from '@prisma/client'
import { randomBytes } from 'node:crypto'

import { AcceptInvitationDto } from './dto/requests/accept-invitation.dto'
import { CreateInvitationDto } from './dto/requests/create-invitation.dto'
import { ListInvitationsQueryDto } from './dto/requests/list-invitations-query.dto'
import { PreviewInvitationQueryDto } from './dto/requests/preview-invitation-query.dto'
import { PreviewInvitationResponseDto } from './dto/responses/preview-invitation-response.dto'
import { buildInvitationEmail } from './infra/invitation-email.factory'
import { InvitationLinksService } from './infra/invitation-links.service'
import { InvitationRepository } from './invitation.repository'

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationRepository: InvitationRepository,
    private readonly membershipService: MembershipService,
    private readonly auditLogsService: AuditLogsService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly invitationLinksService: InvitationLinksService,
    private readonly usagePolicyService: UsagePolicyService
  ) {}

  async create(actorUserId: string, organizationId: string, dto: CreateInvitationDto, tx?: Prisma.TransactionClient) {
    const createInvitation = async (trx: Prisma.TransactionClient) => {
      await this.acquireInvitationEmailLock(organizationId, dto.email, trx)

      const actorMembership = await this.membershipService.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      this.assertCanManageInvitations(actorMembership.role)

      if (actorMembership.role === MembershipRole.admin && dto.role === MembershipRole.owner) {
        throw new ForbiddenException('Admins cannot invite owners')
      }

      const invitedUser = await this.userService.findByEmail(dto.email, trx)

      if (invitedUser) {
        const invitedMembership = await this.membershipService.findByUserAndOrganization(
          invitedUser.id,
          organizationId,
          trx
        )

        if (invitedMembership) {
          throw new ConflictException('User already belongs to this organization')
        }
      }

      const existingPendingInvitation = await this.invitationRepository.findPendingByOrganizationAndEmail(
        organizationId,
        dto.email,
        trx
      )

      if (existingPendingInvitation) {
        throw new ConflictException('A pending invitation already exists for this email')
      }

      await this.usagePolicyService.assertCanCreateMembership(organizationId, trx)

      let invitation: OrganizationInvitation & {
        invitedBy: {
          id: string
          name: string
          email: string
        }
        organization: {
          id: string
          name: string
          slug: string
        }
      }

      try {
        invitation = await this.invitationRepository.create(
          {
            organizationId,
            invitedByUserId: actorUserId,
            email: dto.email,
            role: dto.role,
            token: this.generateToken(),
            expiresAt: this.buildExpirationDate()
          },
          trx
        )
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('A pending invitation already exists for this email')
        }

        throw error
      }

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'organization_invitation',
          entityId: invitation.id,
          action: AuditLogAction.created,
          metadata: {
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt
          }
        },
        trx
      )

      await this.sendInvitationEmail(invitation, actorUserId, trx)

      return invitation
    }

    if (tx) {
      return createInvitation(tx)
    }

    return this.prisma.$transaction(trx => createInvitation(trx))
  }

  async findAll(organizationId: string, query: ListInvitationsQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    const result = await this.invitationRepository.findManyByOrganization(
      {
        organizationId,
        cursor: query.cursor,
        limit,
        email: query.email,
        status: query.status
      },
      tx
    )

    return {
      items: result.items,
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor
      }
    }
  }

  async preview(
    query: PreviewInvitationQueryDto,
    tx?: Prisma.TransactionClient
  ): Promise<PreviewInvitationResponseDto> {
    const invitation = await this.invitationRepository.findByToken(query.token, tx)

    if (!invitation) {
      throw new NotFoundException('Invitation not found')
    }

    const isExpired = invitation.expiresAt.getTime() <= Date.now()

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      organizationName: invitation.organization.name,
      organizationSlug: invitation.organization.slug,
      invitedByName: invitation.invitedBy.name,
      expiresAt: invitation.expiresAt,
      isExpired,
      canAccept: invitation.status === OrganizationInvitationStatus.pending && !isExpired
    }
  }

  async revoke(actorUserId: string, organizationId: string, invitationId: string, tx?: Prisma.TransactionClient) {
    const revokeInvitation = async (trx: Prisma.TransactionClient) => {
      await this.acquireInvitationLock(invitationId, trx)

      const actorMembership = await this.membershipService.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      this.assertCanManageInvitations(actorMembership.role)

      const invitation = await this.getInvitationOrThrow(invitationId, organizationId, trx)

      if (actorMembership.role === MembershipRole.admin && invitation.role === MembershipRole.owner) {
        throw new ForbiddenException('Admins cannot manage owner invitations')
      }

      if (invitation.status !== OrganizationInvitationStatus.pending) {
        throw new ConflictException('Only pending invitations can be revoked')
      }

      const updatedInvitation = await this.invitationRepository.update(
        invitation.id,
        {
          status: OrganizationInvitationStatus.revoked,
          revokedAt: new Date()
        },
        trx
      )

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'organization_invitation',
          entityId: updatedInvitation.id,
          action: AuditLogAction.updated,
          metadata: {
            email: updatedInvitation.email,
            role: updatedInvitation.role,
            status: updatedInvitation.status
          }
        },
        trx
      )

      return updatedInvitation
    }

    if (tx) {
      return revokeInvitation(tx)
    }

    return this.prisma.$transaction(trx => revokeInvitation(trx))
  }

  async resend(actorUserId: string, organizationId: string, invitationId: string, tx?: Prisma.TransactionClient) {
    const resendInvitation = async (trx: Prisma.TransactionClient) => {
      await this.acquireInvitationLock(invitationId, trx)

      const actorMembership = await this.membershipService.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      this.assertCanManageInvitations(actorMembership.role)

      const invitation = await this.getInvitationOrThrow(invitationId, organizationId, trx)

      if (actorMembership.role === MembershipRole.admin && invitation.role === MembershipRole.owner) {
        throw new ForbiddenException('Admins cannot manage owner invitations')
      }

      if (
        invitation.status !== OrganizationInvitationStatus.pending &&
        invitation.status !== OrganizationInvitationStatus.expired
      ) {
        throw new ConflictException('Only pending or expired invitations can be resent')
      }

      const resentInvitation = await this.invitationRepository.update(
        invitation.id,
        {
          token: this.generateToken(),
          expiresAt: this.buildExpirationDate(),
          status: OrganizationInvitationStatus.pending,
          revokedAt: null,
          acceptedAt: null
        },
        trx
      )

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'organization_invitation',
          entityId: resentInvitation.id,
          action: AuditLogAction.updated,
          metadata: {
            email: resentInvitation.email,
            role: resentInvitation.role,
            status: resentInvitation.status,
            expiresAt: resentInvitation.expiresAt,
            reason: 'resent'
          }
        },
        trx
      )

      await this.sendInvitationEmail(resentInvitation, actorUserId, trx)

      return resentInvitation
    }

    if (tx) {
      return resendInvitation(tx)
    }

    return this.prisma.$transaction(trx => resendInvitation(trx))
  }

  async accept(actorUserId: string, dto: AcceptInvitationDto, tx?: Prisma.TransactionClient) {
    const acceptInvitation = async (trx: Prisma.TransactionClient) => {
      const initialInvitation = await this.invitationRepository.findByToken(dto.token, trx)

      if (!initialInvitation) {
        throw new NotFoundException('Invitation not found')
      }

      await this.acquireInvitationLock(initialInvitation.id, trx)

      const invitation = await this.invitationRepository.findByToken(dto.token, trx)

      if (!invitation) {
        throw new NotFoundException('Invitation not found')
      }

      if (invitation.status !== OrganizationInvitationStatus.pending) {
        throw new ConflictException('Invitation is no longer pending')
      }

      if (invitation.expiresAt.getTime() <= Date.now()) {
        await this.invitationRepository.update(
          invitation.id,
          {
            status: OrganizationInvitationStatus.expired
          },
          trx
        )

        throw new ConflictException('Invitation has expired')
      }

      const user = await this.userService.findById(actorUserId, trx)

      if (!user) {
        throw new NotFoundException('User not found')
      }

      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new ForbiddenException('You can only accept invitations sent to your own email')
      }

      const existingMembership = await this.membershipService.findByUserAndOrganization(
        actorUserId,
        invitation.organizationId,
        trx
      )

      if (existingMembership) {
        throw new ConflictException('User already belongs to this organization')
      }

      await this.membershipService.create(
        {
          userId: actorUserId,
          organizationId: invitation.organizationId,
          role: invitation.role
        },
        trx
      )

      const acceptedInvitation = await this.invitationRepository.update(
        invitation.id,
        {
          status: OrganizationInvitationStatus.accepted,
          acceptedAt: new Date()
        },
        trx
      )

      await this.auditLogsService.create(
        {
          organizationId: invitation.organizationId,
          actorUserId,
          entityType: 'organization_invitation',
          entityId: acceptedInvitation.id,
          action: AuditLogAction.updated,
          metadata: {
            email: acceptedInvitation.email,
            role: acceptedInvitation.role,
            status: acceptedInvitation.status
          }
        },
        trx
      )

      return acceptedInvitation
    }

    if (tx) {
      return acceptInvitation(tx)
    }

    return this.prisma.$transaction(trx => acceptInvitation(trx))
  }

  private async getInvitationOrThrow(invitationId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const invitation = await this.invitationRepository.findByIdAndOrganization(invitationId, organizationId, tx)

    if (!invitation) {
      throw new NotFoundException('Invitation not found')
    }

    return invitation
  }

  private assertCanManageInvitations(role: MembershipRole) {
    if (role !== MembershipRole.owner && role !== MembershipRole.admin) {
      throw new ForbiddenException('You do not have permission to manage invitations')
    }
  }

  private async sendInvitationEmail(
    invitation: OrganizationInvitation & {
      invitedBy: {
        id: string
        name: string
        email: string
      }
      organization: {
        id: string
        name: string
        slug: string
      }
    },
    actorUserId: string,
    tx?: Prisma.TransactionClient
  ) {
    const acceptUrl = this.invitationLinksService.buildAcceptInvitationUrl(invitation.token)

    const emailContent = buildInvitationEmail({
      invitation,
      invitedByName: invitation.invitedBy.name,
      organizationName: invitation.organization.name,
      acceptUrl
    })

    await this.emailService.send(
      {
        organizationId: invitation.organizationId,
        sentBy: actorUserId,
        to: invitation.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        metadata: {
          type: 'organization_invitation',
          organizationId: invitation.organizationId,
          invitationId: invitation.id
        }
      },
      tx
    )
  }

  private async acquireInvitationLock(invitationId: string, tx: Prisma.TransactionClient) {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`organization-invitation:${invitationId}`}))
    `
  }

  private async acquireInvitationEmailLock(organizationId: string, email: string, tx: Prisma.TransactionClient) {
    const normalizedEmail = this.normalizeEmail(email)

    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`organization-invitation:${organizationId}:${normalizedEmail}`}))
    `
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private generateToken(): string {
    return randomBytes(24).toString('hex')
  }

  private buildExpirationDate(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    return expiresAt
  }
}
