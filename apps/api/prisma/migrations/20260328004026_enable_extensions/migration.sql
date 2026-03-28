-- Enable CITEXT
-- Provides case-insensitive text type.
-- Used for emails to avoid issues like:
-- 'raul@email.com' != 'RAUL@email.com'
CREATE EXTENSION IF NOT EXISTS citext;

-- Enable pg_trgm
-- Provides trigram-based indexing and similarity search.
-- Used to improve LIKE/ILIKE queries and fuzzy search performance.
CREATE EXTENSION IF NOT EXISTS pg_trgm;