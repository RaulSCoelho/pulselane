-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('free', 'starter', 'growth');

-- CreateEnum
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('free', 'active', 'trialing', 'past_due', 'canceled', 'incomplete');

-- CreateTable
CREATE TABLE "organization_billing" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan" "BillingPlan" NOT NULL DEFAULT 'free',
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_webhook_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "provider_created_at" TIMESTAMP(3),
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_billing_organization_id_key" ON "organization_billing"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_billing_stripe_customer_id_key" ON "organization_billing"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_billing_stripe_subscription_id_key" ON "organization_billing"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "organization_billing_plan_idx" ON "organization_billing"("plan");

-- CreateIndex
CREATE INDEX "organization_billing_status_idx" ON "organization_billing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "billing_webhook_events_provider_event_id_key" ON "billing_webhook_events"("provider_event_id");

-- CreateIndex
CREATE INDEX "billing_webhook_events_organization_id_idx" ON "billing_webhook_events"("organization_id");

-- CreateIndex
CREATE INDEX "billing_webhook_events_event_type_idx" ON "billing_webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "billing_webhook_events_created_at_idx" ON "billing_webhook_events"("created_at");

-- AddForeignKey
ALTER TABLE "organization_billing" ADD CONSTRAINT "organization_billing_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_webhook_events" ADD CONSTRAINT "billing_webhook_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
