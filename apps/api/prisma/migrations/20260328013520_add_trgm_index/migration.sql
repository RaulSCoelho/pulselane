-- Trigram index for fast fuzzy search on client name
CREATE INDEX "clients_name_trgm_idx"
ON "clients"
USING gin ("name" gin_trgm_ops);

-- Trigram index for company name search
CREATE INDEX "clients_company_name_trgm_idx"
ON "clients"
USING gin ("company_name" gin_trgm_ops);