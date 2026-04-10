-- AlterEnum
ALTER TYPE "AuditLogAction" ADD VALUE 'archived';

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'blocked';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clients_organization_id_archived_at_idx" ON "clients"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "clients_organization_id_created_at_idx" ON "clients"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "projects_organization_id_archived_at_idx" ON "projects"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "projects_organization_id_created_at_idx" ON "projects"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "tasks_organization_id_archived_at_idx" ON "tasks"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "tasks_organization_id_created_at_idx" ON "tasks"("organization_id", "created_at");
