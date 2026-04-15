import { EnvConfig } from '@/config/env.config'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BillingPlan, BillingSubscriptionStatus, Prisma } from '@prisma/client'
import Stripe from 'stripe'

import { BillingRepository } from './billing.repository'
import { BillingService } from './billing.service'
import { isPaidBillingPlan, type PaidBillingPlan } from './stripe-plan-mapping'

type StripeClient = InstanceType<typeof Stripe>
type StripeWebhookEvent = ReturnType<StripeClient['webhooks']['constructEvent']>
type StripeCheckoutSession = Awaited<ReturnType<StripeClient['checkout']['sessions']['retrieve']>>
type StripeSubscription = Awaited<ReturnType<StripeClient['subscriptions']['retrieve']>>
type StripeSubscriptionStatus = StripeSubscription['status']

@Injectable()
export class StripeBillingService {
  private readonly stripeEnabled: boolean
  private readonly stripe: StripeClient | null
  private readonly priceByPlan: Record<PaidBillingPlan, string>

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
    private readonly billingRepository: BillingRepository,
    private readonly billingService: BillingService,
    private readonly auditLogsService: AuditLogsService
  ) {
    this.stripeEnabled = this.configService.getOrThrow('stripeEnabled', { infer: true })

    this.priceByPlan = {
      [BillingPlan.starter]: this.configService.get('stripePriceStarter', { infer: true }) ?? '',
      [BillingPlan.growth]: this.configService.get('stripePriceGrowth', { infer: true }) ?? ''
    }

    if (this.stripeEnabled) {
      const stripeSecretKey = this.configService.getOrThrow('stripeSecretKey', { infer: true })
      this.stripe = new Stripe(stripeSecretKey)
    } else {
      this.stripe = null
    }
  }

  async createCheckoutSession(actorUserId: string, organizationId: string, plan: BillingPlan) {
    this.assertStripeEnabled()

    if (!isPaidBillingPlan(plan)) {
      throw new BadRequestException('Checkout is only available for paid plans')
    }

    const billing = await this.billingService.getByOrganizationIdOrThrow(organizationId)

    if (
      billing.stripeSubscriptionId &&
      (billing.status === BillingSubscriptionStatus.active || billing.status === BillingSubscriptionStatus.trialing)
    ) {
      throw new ConflictException('Organization already has an active Stripe subscription. Use the billing portal.')
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId
      }
    })

    if (!organization) {
      throw new BadRequestException('Organization not found')
    }

    const session = await this.stripe!.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${this.configService.getOrThrow('appWebUrl', { infer: true })}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.getOrThrow('appWebUrl', { infer: true })}/settings/billing?checkout=canceled`,
      customer: billing.stripeCustomerId ?? undefined,
      line_items: [
        {
          price: this.getPriceIdByPlan(plan),
          quantity: 1
        }
      ],
      metadata: {
        organizationId,
        plan
      },
      subscription_data: {
        metadata: {
          organizationId,
          plan
        }
      },
      allow_promotion_codes: true
    })

    await this.auditLogsService.create({
      organizationId,
      actorUserId,
      entityType: 'organization_billing',
      entityId: billing.id,
      action: 'updated',
      metadata: {
        source: 'stripe_checkout_session',
        checkoutSessionId: session.id,
        targetPlan: plan
      }
    })

    if (!session.url) {
      throw new InternalServerErrorException('Stripe checkout session did not return a URL')
    }

    return {
      sessionId: session.id,
      url: session.url
    }
  }

  async createBillingPortalSession(actorUserId: string, organizationId: string) {
    this.assertStripeEnabled()

    const billing = await this.billingService.getByOrganizationIdOrThrow(organizationId)

    if (!billing.stripeCustomerId) {
      throw new ConflictException('Billing portal is unavailable until a Stripe customer exists')
    }

    const session = await this.stripe!.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${this.configService.getOrThrow('appWebUrl', { infer: true })}/settings/billing`
    })

    await this.auditLogsService.create({
      organizationId,
      actorUserId,
      entityType: 'organization_billing',
      entityId: billing.id,
      action: 'updated',
      metadata: {
        source: 'stripe_billing_portal',
        billingPortalSessionUrl: session.url
      }
    })

    return {
      url: session.url
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): StripeWebhookEvent {
    this.assertStripeEnabled()

    const webhookSecret = this.configService.getOrThrow('stripeWebhookSecret', { infer: true })

    try {
      return this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature')
    }
  }

  async processWebhook(event: StripeWebhookEvent) {
    this.assertStripeEnabled()

    return this.prisma.$transaction(async tx => {
      await this.acquireWebhookEventLock(event.id, tx)

      const existingEvent = await this.billingRepository.findWebhookEventByProviderEventId(event.id, tx)

      if (!existingEvent) {
        await this.billingRepository.createWebhookEvent(
          {
            providerEventId: event.id,
            eventType: event.type,
            providerCreatedAt: event.created ? new Date(event.created * 1000) : null,
            payload: event as unknown as Prisma.InputJsonValue,
            organizationId: null
          },
          tx
        )
      } else if (existingEvent.processedAt) {
        return
      }

      const organizationId = await this.handleStripeEvent(event, tx)

      await this.billingRepository.markWebhookEventProcessed(
        event.id,
        {
          organizationId,
          processedAt: new Date()
        },
        tx
      )
    })
  }

  private async handleStripeEvent(event: StripeWebhookEvent, tx: Prisma.TransactionClient): Promise<string | null> {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutSessionCompleted(event.data.object as StripeCheckoutSession, tx)

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.handleSubscriptionEvent(event.data.object as StripeSubscription, tx)

      default:
        return null
    }
  }

  private async handleCheckoutSessionCompleted(
    session: StripeCheckoutSession,
    tx: Prisma.TransactionClient
  ): Promise<string | null> {
    const organizationIdFromMetadata = session.metadata?.organizationId ?? null
    const customerId = typeof session.customer === 'string' ? session.customer : null
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

    const organizationId =
      organizationIdFromMetadata ??
      (customerId
        ? ((await this.billingRepository.findByStripeCustomerId(customerId, tx))?.organizationId ?? null)
        : null)

    if (!organizationId) {
      return null
    }

    if (subscriptionId) {
      const subscription = await this.stripe!.subscriptions.retrieve(subscriptionId)
      await this.syncFromStripeSubscription(subscription, organizationId, tx)
      return organizationId
    }

    if (customerId) {
      const billing = await this.billingService.getByOrganizationIdOrThrow(organizationId, tx)

      await this.billingRepository.updateOrganizationBilling(
        organizationId,
        {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: billing.status,
          plan: billing.plan
        },
        tx
      )
    }

    return organizationId
  }

  private async handleSubscriptionEvent(
    subscription: StripeSubscription,
    tx: Prisma.TransactionClient
  ): Promise<string | null> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : null
    const subscriptionId = subscription.id

    const organizationIdFromMetadata = subscription.metadata?.organizationId ?? null
    const organizationIdFromCustomer = customerId
      ? ((await this.billingRepository.findByStripeCustomerId(customerId, tx))?.organizationId ?? null)
      : null
    const organizationIdFromSubscription =
      (await this.billingRepository.findByStripeSubscriptionId(subscriptionId, tx))?.organizationId ?? null

    const organizationId = organizationIdFromMetadata ?? organizationIdFromCustomer ?? organizationIdFromSubscription

    if (!organizationId) {
      return null
    }

    await this.syncFromStripeSubscription(subscription, organizationId, tx)

    return organizationId
  }

  private async syncFromStripeSubscription(
    subscription: StripeSubscription,
    organizationId: string,
    tx: Prisma.TransactionClient
  ) {
    const currentBilling = await this.billingService.getByOrganizationIdOrThrow(organizationId, tx)
    const nextPlan = this.resolvePlanFromSubscription(subscription, currentBilling.plan)
    const nextStatus = this.mapStripeSubscriptionStatus(subscription.status)
    const nextCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null
    const nextSubscriptionId = subscription.id
    const nextCurrentPeriodEnd = this.getSubscriptionCurrentPeriodEnd(subscription)
    const nextCancelAtPeriodEnd = subscription.cancel_at_period_end

    const changed =
      currentBilling.plan !== nextPlan ||
      currentBilling.status !== nextStatus ||
      currentBilling.stripeCustomerId !== nextCustomerId ||
      currentBilling.stripeSubscriptionId !== nextSubscriptionId ||
      (currentBilling.currentPeriodEnd?.getTime() ?? null) !== (nextCurrentPeriodEnd?.getTime() ?? null) ||
      currentBilling.cancelAtPeriodEnd !== nextCancelAtPeriodEnd

    const updatedBilling = await this.billingRepository.updateOrganizationBilling(
      organizationId,
      {
        plan: nextPlan,
        status: nextStatus,
        stripeCustomerId: nextCustomerId,
        stripeSubscriptionId: nextSubscriptionId,
        currentPeriodEnd: nextCurrentPeriodEnd,
        cancelAtPeriodEnd: nextCancelAtPeriodEnd
      },
      tx
    )

    if (!changed) {
      return updatedBilling
    }

    const auditActorUserId = await this.billingRepository.findAuditActorUserIdByOrganizationId(organizationId, tx)

    if (auditActorUserId) {
      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId: auditActorUserId,
          entityType: 'organization_billing',
          entityId: updatedBilling.id,
          action: 'updated',
          metadata: {
            source: 'stripe_webhook',
            previousPlan: currentBilling.plan,
            previousStatus: currentBilling.status,
            previousStripeCustomerId: currentBilling.stripeCustomerId,
            previousStripeSubscriptionId: currentBilling.stripeSubscriptionId,
            previousCurrentPeriodEnd: currentBilling.currentPeriodEnd,
            previousCancelAtPeriodEnd: currentBilling.cancelAtPeriodEnd,
            plan: updatedBilling.plan,
            status: updatedBilling.status,
            stripeCustomerId: updatedBilling.stripeCustomerId,
            stripeSubscriptionId: updatedBilling.stripeSubscriptionId,
            currentPeriodEnd: updatedBilling.currentPeriodEnd,
            cancelAtPeriodEnd: updatedBilling.cancelAtPeriodEnd
          }
        },
        tx
      )
    }

    return updatedBilling
  }

  private resolvePlanFromSubscription(subscription: StripeSubscription, fallbackPlan: BillingPlan): BillingPlan {
    const priceIds = subscription.items.data
      .map(item => item.price.id)
      .filter((value): value is string => typeof value === 'string')

    for (const priceId of priceIds) {
      if (priceId === this.getPriceIdByPlan(BillingPlan.starter)) {
        return BillingPlan.starter
      }

      if (priceId === this.getPriceIdByPlan(BillingPlan.growth)) {
        return BillingPlan.growth
      }
    }

    const metadataPlan = subscription.metadata?.plan

    if (metadataPlan === BillingPlan.starter || metadataPlan === BillingPlan.growth) {
      return metadataPlan
    }

    return fallbackPlan
  }

  private mapStripeSubscriptionStatus(status: StripeSubscriptionStatus): BillingSubscriptionStatus {
    switch (status) {
      case 'active':
        return BillingSubscriptionStatus.active
      case 'trialing':
        return BillingSubscriptionStatus.trialing
      case 'past_due':
        return BillingSubscriptionStatus.past_due
      case 'canceled':
        return BillingSubscriptionStatus.canceled
      case 'incomplete':
      case 'incomplete_expired':
      case 'paused':
      case 'unpaid':
        return BillingSubscriptionStatus.incomplete
      default:
        return BillingSubscriptionStatus.incomplete
    }
  }

  private getSubscriptionCurrentPeriodEnd(subscription: StripeSubscription): Date | null {
    const subscriptionWithPeriodEnd = subscription as StripeSubscription & {
      current_period_end?: number | null
    }

    if (typeof subscriptionWithPeriodEnd.current_period_end === 'number') {
      return new Date(subscriptionWithPeriodEnd.current_period_end * 1000)
    }

    const itemPeriodEnd = subscription.items.data[0] as (typeof subscription.items.data)[number] & {
      current_period_end?: number | null
    }

    if (typeof itemPeriodEnd?.current_period_end === 'number') {
      return new Date(itemPeriodEnd.current_period_end * 1000)
    }

    return null
  }

  private getPriceIdByPlan(plan: PaidBillingPlan) {
    const priceId = this.priceByPlan[plan]

    if (!priceId) {
      throw new ServiceUnavailableException(`Stripe price is not configured for plan ${plan}`)
    }

    return priceId
  }

  private assertStripeEnabled() {
    if (!this.stripeEnabled || !this.stripe) {
      throw new ServiceUnavailableException('Stripe billing is not enabled')
    }
  }

  private async acquireWebhookEventLock(providerEventId: string, tx: Prisma.TransactionClient) {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`stripe-webhook:${providerEventId}`}))
    `
  }
}
