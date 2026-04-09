-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "email_deliveries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sent_by" TEXT,
    "to" CITEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "transport" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_deliveries_organization_id_idx" ON "email_deliveries"("organization_id");

-- CreateIndex
CREATE INDEX "email_deliveries_organization_id_status_idx" ON "email_deliveries"("organization_id", "status");

-- CreateIndex
CREATE INDEX "email_deliveries_organization_id_created_at_idx" ON "email_deliveries"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "email_deliveries_sent_by_idx" ON "email_deliveries"("sent_by");

-- CreateIndex
CREATE INDEX "email_deliveries_to_idx" ON "email_deliveries"("to");

-- AddForeignKey
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
