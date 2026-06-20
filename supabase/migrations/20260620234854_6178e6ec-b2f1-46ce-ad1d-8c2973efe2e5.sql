CREATE INDEX IF NOT EXISTS sam_opportunities_deadline_idx
  ON public.sam_opportunities (deadline);

CREATE INDEX IF NOT EXISTS sam_opportunities_deadline_score_idx
  ON public.sam_opportunities (deadline ASC NULLS LAST, match_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS sam_opportunities_set_aside_idx
  ON public.sam_opportunities (set_aside);

CREATE INDEX IF NOT EXISTS sam_opportunities_value_idx
  ON public.sam_opportunities (value);

CREATE INDEX IF NOT EXISTS usaspending_awards_set_aside_idx
  ON public.usaspending_awards (set_aside);

ANALYZE public.sam_opportunities;
ANALYZE public.usaspending_awards;