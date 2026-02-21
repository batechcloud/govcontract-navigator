ALTER TABLE company_profiles
ADD COLUMN psc_codes text[] DEFAULT '{}'::text[];