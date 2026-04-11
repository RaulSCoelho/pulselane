CREATE UNIQUE INDEX "organization_invitations_pending_org_email_key"
ON "organization_invitations" ("organization_id", "email")
WHERE "status" = 'pending';