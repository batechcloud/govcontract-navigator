-- Tracked Competitors table
CREATE TABLE public.tracked_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_uei TEXT,
  competitor_cage TEXT,
  naics_codes TEXT[] DEFAULT '{}',
  total_awards INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, competitor_name)
);

-- Competitor Awards (from USAspending)
CREATE TABLE public.competitor_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_competitor_id UUID NOT NULL REFERENCES public.tracked_competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  award_id TEXT NOT NULL,
  award_description TEXT,
  awarding_agency TEXT,
  award_amount NUMERIC,
  award_date DATE,
  naics_code TEXT,
  psc_code TEXT,
  place_of_performance TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tracked_competitor_id, award_id)
);

-- Win/Loss Records (user's own bids)
CREATE TABLE public.win_loss_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  opportunity_id TEXT,
  opportunity_title TEXT NOT NULL,
  agency TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'no_bid', 'pending')),
  award_amount NUMERIC,
  bid_amount NUMERIC,
  winner_name TEXT,
  winner_uei TEXT,
  loss_reason TEXT,
  lessons_learned TEXT,
  bid_date DATE,
  decision_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.win_loss_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracked_competitors
CREATE POLICY "Users can view their own tracked competitors" ON public.tracked_competitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked competitors" ON public.tracked_competitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked competitors" ON public.tracked_competitors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked competitors" ON public.tracked_competitors
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for competitor_awards
CREATE POLICY "Users can view their competitor awards" ON public.competitor_awards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their competitor awards" ON public.competitor_awards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their competitor awards" ON public.competitor_awards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for win_loss_records
CREATE POLICY "Users can view their own win/loss records" ON public.win_loss_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own win/loss records" ON public.win_loss_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own win/loss records" ON public.win_loss_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own win/loss records" ON public.win_loss_records
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_tracked_competitors_updated_at
  BEFORE UPDATE ON public.tracked_competitors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_win_loss_records_updated_at
  BEFORE UPDATE ON public.win_loss_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();