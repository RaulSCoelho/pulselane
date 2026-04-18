-- CreateTable
CREATE TABLE "system_heartbeats" (
    "id" TEXT NOT NULL,
    "service_key" TEXT NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_heartbeats_service_key_key" ON "system_heartbeats"("service_key");
