
CREATE OR REPLACE VIEW public.sam_opportunities_compat
WITH (security_invoker = true)
AS
SELECT
  id,
  notice_id        AS contract_id,
  title,
  agency,
  parent_agency,
  description,
  location,
  value,
  deadline,
  posted_date,
  naics_code,
  psc_code,
  set_aside,
  contract_type,
  'SAM.gov'::text  AS source,
  url,
  match_score,
  resource_links,
  solicitation_number,
  raw              AS raw_data,
  synced_at        AS fetched_at,
  created_at,
  updated_at
FROM public.sam_opportunities;

GRANT SELECT ON public.sam_opportunities_compat TO authenticated;
GRANT SELECT ON public.sam_opportunities_compat TO service_role;
