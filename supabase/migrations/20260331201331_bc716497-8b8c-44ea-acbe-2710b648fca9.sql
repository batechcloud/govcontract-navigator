
DROP INDEX IF EXISTS idx_contracts_agency;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE INDEX idx_contracts_agency ON public.contracts USING gin (agency extensions.gin_trgm_ops);
