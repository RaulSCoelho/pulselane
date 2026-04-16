import { Auth } from '@/common/decorators/auth.decorator'
import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import { MetricsService } from '@/infra/observability/metrics.service'
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard'
import { OrganizationRolesGuard } from '@/modules/organization/guards/organization-roles.guard'
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'
import type { FastifyRequest } from 'fastify'

import { CreateCheckoutSessionDto } from './dto/requests/create-checkout-session.dto'
import { CreateBillingPortalSessionResponseDto } from './dto/responses/create-billing-portal-session-response.dto'
import { CreateCheckoutSessionResponseDto } from './dto/responses/create-checkout-session-response.dto'
import { StripeWebhookResponseDto } from './dto/responses/stripe-webhook-response.dto'
import { StripeBillingService } from './stripe-billing.service'

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly stripeBillingService: StripeBillingService,
    private readonly metricsService: MetricsService
  ) {}

  @Post('checkout-session')
  @ApiBearerAuth()
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Create Stripe checkout session for a paid plan' })
  @ApiOkResponse({
    description: 'Checkout session created successfully',
    type: CreateCheckoutSessionResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiForbiddenResponse({
    description: 'Forbidden',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or invalid paid plan selection',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Organization already has an active Stripe subscription',
    type: ErrorResponseDto
  })
  @ApiServiceUnavailableResponse({
    description: 'Stripe billing is not enabled',
    type: ErrorResponseDto
  })
  createCheckoutSession(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateCheckoutSessionDto
  ): Promise<CreateCheckoutSessionResponseDto> {
    return this.stripeBillingService.createCheckoutSession(actorUserId, organizationId, dto.plan)
  }

  @Post('portal-session')
  @ApiBearerAuth()
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  @ApiOkResponse({
    description: 'Billing portal session created successfully',
    type: CreateBillingPortalSessionResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiForbiddenResponse({
    description: 'Forbidden',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Billing portal is unavailable until a Stripe customer exists',
    type: ErrorResponseDto
  })
  @ApiServiceUnavailableResponse({
    description: 'Stripe billing is not enabled',
    type: ErrorResponseDto
  })
  createBillingPortalSession(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string
  ): Promise<CreateBillingPortalSessionResponseDto> {
    return this.stripeBillingService.createBillingPortalSession(actorUserId, organizationId)
  }

  @Post('webhooks/stripe')
  @Auth({ mode: 'public' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Stripe webhook events' })
  @ApiOkResponse({
    description: 'Stripe webhook accepted',
    type: StripeWebhookResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid Stripe webhook payload or signature',
    type: ErrorResponseDto
  })
  @ApiServiceUnavailableResponse({
    description: 'Stripe billing is not enabled',
    type: ErrorResponseDto
  })
  async handleStripeWebhook(
    @Req() request: FastifyRequest & { rawBody?: Buffer | string },
    @Headers('stripe-signature') signature?: string
  ): Promise<StripeWebhookResponseDto> {
    if (!signature) {
      this.metricsService.recordWebhookFailure({
        provider: 'stripe',
        eventType: 'missing_signature'
      })

      throw new BadRequestException('Missing Stripe signature header')
    }

    const rawBody =
      request.rawBody === undefined
        ? Buffer.from('')
        : Buffer.isBuffer(request.rawBody)
          ? request.rawBody
          : Buffer.from(request.rawBody)

    let eventType = 'unknown'

    try {
      const event = this.stripeBillingService.constructWebhookEvent(rawBody, signature)
      eventType = event.type

      await this.stripeBillingService.processWebhook(event)

      return {
        received: true
      }
    } catch (error) {
      this.metricsService.recordWebhookFailure({
        provider: 'stripe',
        eventType
      })

      throw error
    }
  }
}
