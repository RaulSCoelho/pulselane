-- DropIndex
DROP INDEX "clients_company_name_trgm_idx";

-- DropIndex
DROP INDEX "clients_name_trgm_idx";

-- CreateIndex
CREATE INDEX "clients_organization_id_status_idx" ON "clients"("organization_id", "status");
