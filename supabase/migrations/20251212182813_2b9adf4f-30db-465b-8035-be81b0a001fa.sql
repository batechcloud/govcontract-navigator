-- Subscription Plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  yearly_price INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Features table
CREATE TABLE public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  feature_type TEXT NOT NULL DEFAULT 'boolean',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plan Features mapping (which features each plan has)
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

-- User Subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feature Usage tracking
CREATE TABLE public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature_id, period_start)
);

-- User Feature Overrides (admin grants/revokes)
CREATE TABLE public.user_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL,
  usage_limit_override INTEGER,
  granted_by UUID,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature_id)
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- RLS Policies for features (public read)
CREATE POLICY "Anyone can view features" ON public.features
  FOR SELECT USING (true);

-- RLS Policies for plan_features (public read)
CREATE POLICY "Anyone can view plan features" ON public.plan_features
  FOR SELECT USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for feature_usage
CREATE POLICY "Users can view their own usage" ON public.feature_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.feature_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.feature_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_feature_overrides
CREATE POLICY "Users can view their own overrides" ON public.user_feature_overrides
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage overrides
CREATE POLICY "Admins can manage overrides" ON public.user_feature_overrides
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON public.feature_usage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to check feature access
CREATE OR REPLACE FUNCTION public.check_feature_access(
  _user_id UUID,
  _feature_code TEXT
)
RETURNS TABLE (
  has_access BOOLEAN,
  usage_limit INTEGER,
  current_usage INTEGER,
  is_override BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _feature_id UUID;
  _plan_id UUID;
  _override RECORD;
  _plan_feature RECORD;
  _usage INTEGER;
BEGIN
  -- Get feature ID
  SELECT id INTO _feature_id FROM features WHERE code = _feature_code;
  IF _feature_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, 0, false;
    RETURN;
  END IF;

  -- Check for override first
  SELECT * INTO _override FROM user_feature_overrides
    WHERE user_id = _user_id AND feature_id = _feature_id
    AND (expires_at IS NULL OR expires_at > now());
  
  IF _override IS NOT NULL THEN
    SELECT COALESCE(usage_count, 0) INTO _usage FROM feature_usage
      WHERE user_id = _user_id AND feature_id = _feature_id
      AND period_start <= now() AND period_end > now();
    
    RETURN QUERY SELECT 
      _override.is_enabled,
      _override.usage_limit_override,
      COALESCE(_usage, 0),
      true;
    RETURN;
  END IF;

  -- Get user's plan
  SELECT plan_id INTO _plan_id FROM user_subscriptions
    WHERE user_id = _user_id AND status = 'active';
  
  -- Default to starter plan if no subscription
  IF _plan_id IS NULL THEN
    SELECT id INTO _plan_id FROM subscription_plans WHERE name = 'starter';
  END IF;

  -- Get plan feature settings
  SELECT * INTO _plan_feature FROM plan_features
    WHERE plan_id = _plan_id AND feature_id = _feature_id;

  IF _plan_feature IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, 0, false;
    RETURN;
  END IF;

  -- Get current usage
  SELECT COALESCE(usage_count, 0) INTO _usage FROM feature_usage
    WHERE user_id = _user_id AND feature_id = _feature_id
    AND period_start <= now() AND period_end > now();

  RETURN QUERY SELECT 
    _plan_feature.is_enabled,
    _plan_feature.usage_limit,
    COALESCE(_usage, 0),
    false;
END;
$$;

-- Function to increment feature usage
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  _user_id UUID,
  _feature_code TEXT,
  _increment INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _feature_id UUID;
  _new_count INTEGER;
  _period_start TIMESTAMPTZ := date_trunc('month', now());
  _period_end TIMESTAMPTZ := date_trunc('month', now()) + interval '1 month';
BEGIN
  SELECT id INTO _feature_id FROM features WHERE code = _feature_code;
  IF _feature_id IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO feature_usage (user_id, feature_id, usage_count, period_start, period_end)
  VALUES (_user_id, _feature_id, _increment, _period_start, _period_end)
  ON CONFLICT (user_id, feature_id, period_start)
  DO UPDATE SET usage_count = feature_usage.usage_count + _increment, updated_at = now()
  RETURNING usage_count INTO _new_count;

  RETURN _new_count;
END;
$$;

-- Seed subscription plans
INSERT INTO public.subscription_plans (name, display_name, description, monthly_price, yearly_price, sort_order) VALUES
  ('starter', 'Starter', 'For small businesses getting started with government contracts', 49, 39, 1),
  ('professional', 'Professional', 'For growing businesses serious about winning contracts', 149, 119, 2),
  ('enterprise', 'Enterprise', 'For established contractors needing the full suite', 399, 319, 3);

-- Seed features
INSERT INTO public.features (code, name, description, module, feature_type) VALUES
  -- Core module
  ('dashboard', 'Dashboard', 'Access to main dashboard', 'core', 'boolean'),
  ('tracking', 'Contract Tracking', 'Track opportunities through pipeline', 'core', 'boolean'),
  ('calendar', 'Deadline Calendar', 'View deadlines on calendar', 'core', 'boolean'),
  
  -- Search module
  ('search_federal', 'Federal Search', 'Search federal contracts', 'search', 'usage'),
  ('search_state', 'State/Local Search', 'Search state and local opportunities', 'search', 'usage'),
  ('search_dibbs', 'DIBBS Search', 'Search defense logistics', 'search', 'boolean'),
  ('saved_searches', 'Saved Searches', 'Save and run searches', 'search', 'boolean'),
  
  -- AI module
  ('ai_chat', 'AI Opportunity Chat', 'Chat with AI about contracts', 'ai', 'usage'),
  ('ai_summary', 'AI Document Summary', 'Summarize RFP documents', 'ai', 'usage'),
  ('ai_match', 'AI Match Analysis', 'Company-to-opportunity scoring', 'ai', 'usage'),
  ('ai_interpreter', 'Contract Interpreter', 'Plain-language explanations', 'ai', 'usage'),
  
  -- Intelligence module
  ('competitor_analysis', 'Competitor Analysis', 'Analyze competitor wins', 'intelligence', 'boolean'),
  ('market_watch', 'Market Watch', 'Industry trends and analytics', 'intelligence', 'boolean'),
  ('teaming_partners', 'Teaming Partners', 'Find subcontractors/partners', 'intelligence', 'boolean'),
  ('win_loss', 'Win/Loss Analysis', 'Track bid outcomes', 'intelligence', 'boolean'),
  
  -- Proposals module
  ('proposal_generator', 'AI Proposal Generator', 'Generate proposal drafts', 'proposals', 'usage'),
  ('proposal_editor', 'Proposal Editor', 'Edit and refine proposals', 'proposals', 'boolean'),
  ('submission_tracker', 'Submission Tracker', 'Track submissions', 'proposals', 'boolean'),
  ('documents', 'Document Management', 'Store proposal documents', 'proposals', 'boolean'),
  
  -- Team module
  ('team_members', 'Team Members', 'Invite team members', 'team', 'usage'),
  ('collaboration', 'Collaboration', 'Team workflows', 'team', 'boolean');

-- Seed plan_features for Starter
INSERT INTO public.plan_features (plan_id, feature_id, is_enabled, usage_limit)
SELECT p.id, f.id, 
  CASE 
    WHEN f.code IN ('dashboard', 'tracking', 'calendar', 'search_federal', 'saved_searches', 'ai_chat', 'ai_summary') THEN true
    ELSE false
  END,
  CASE f.code
    WHEN 'search_federal' THEN 50
    WHEN 'ai_chat' THEN 10
    WHEN 'ai_summary' THEN 10
    WHEN 'team_members' THEN 1
    ELSE NULL
  END
FROM subscription_plans p, features f
WHERE p.name = 'starter';

-- Seed plan_features for Professional
INSERT INTO public.plan_features (plan_id, feature_id, is_enabled, usage_limit)
SELECT p.id, f.id, 
  CASE 
    WHEN f.code IN ('teaming_partners') THEN false
    ELSE true
  END,
  CASE f.code
    WHEN 'search_federal' THEN 500
    WHEN 'search_state' THEN 500
    WHEN 'ai_chat' THEN 100
    WHEN 'ai_summary' THEN 100
    WHEN 'ai_match' THEN 100
    WHEN 'ai_interpreter' THEN 100
    WHEN 'proposal_generator' THEN 5
    WHEN 'team_members' THEN 5
    ELSE NULL
  END
FROM subscription_plans p, features f
WHERE p.name = 'professional';

-- Seed plan_features for Enterprise (unlimited everything)
INSERT INTO public.plan_features (plan_id, feature_id, is_enabled, usage_limit)
SELECT p.id, f.id, true, NULL
FROM subscription_plans p, features f
WHERE p.name = 'enterprise';