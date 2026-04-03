-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done', 'archived');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "assignee_user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_organization_id_idx" ON "tasks"("organization_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

-- CreateIndex
CREATE INDEX "tasks_assignee_user_id_idx" ON "tasks"("assignee_user_id");

-- CreateIndex
CREATE INDEX "tasks_organization_id_status_idx" ON "tasks"("organization_id", "status");

-- CreateIndex
CREATE INDEX "tasks_organization_id_priority_idx" ON "tasks"("organization_id", "priority");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
