

## Add Per-User Rate Limiting to SAM Search

### Problem
The SAM.gov API has a 450 requests/day global quota. A single user making many searches could exhaust the limit for everyone.

### Approach
Use a new `api_rate_limits` database table to track per-user daily SAM.gov API calls. The edge function checks the count before making an API call and rejects requests that exceed the limit with a clear error message.

### Design Decisions
- **Daily limit per user**: 50 requests/day (allows ~9 active users at full capacity within the 450 global limit)
- **Storage**: A lightweight `api_rate_limits` table with a composite unique constraint on `(user_id, api_name, date)`
- **Reset**: Automatic daily reset by using the current date as a key -- no cleanup jobs needed
- **Graceful handling**: When rate-limited, return a 429 status with a clear message and the reset time, so the frontend can display it

### Changes

**1. Database Migration -- new `api_rate_limits` table**

```sql
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_name text NOT NULL DEFAULT 'sam_search',
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, api_name, request_date)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rate limits"
  ON public.api_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);
```

A database function to atomically increment and check:

```sql
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  _user_id uuid,
  _api_name text,
  _daily_limit integer
)
RETURNS TABLE(allowed boolean, current_count integer, daily_limit integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO api_rate_limits (user_id, api_name, request_date, request_count)
  VALUES (_user_id, _api_name, CURRENT_DATE, 1)
  ON CONFLICT (user_id, api_name, request_date)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1, updated_at = now()
  RETURNING request_count INTO _count;

  RETURN QUERY SELECT _count <= _daily_limit, _count, _daily_limit;
END;
$$;
```

**2. Edge Function -- `supabase/functions/sam-search/index.ts`**

Add rate limit check right after authentication succeeds (around line 94), before any API call logic:

```typescript
// After user is authenticated, check rate limit
const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const DAILY_LIMIT = 50;
const { data: rateData, error: rateError } = await serviceClient
  .rpc('check_and_increment_rate_limit', {
    _user_id: user.id,
    _api_name: 'sam_search',
    _daily_limit: DAILY_LIMIT,
  });

if (rateError) {
  console.error('Rate limit check failed:', rateError);
  // Fail open -- allow the request if rate limiting breaks
} else if (rateData?.[0] && !rateData[0].allowed) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    message: `You've reached your daily limit of ${DAILY_LIMIT} searches. Your limit resets at midnight UTC.`,
    current_count: rateData[0].current_count,
    daily_limit: DAILY_LIMIT,
  }), {
    status: 429,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

Key detail: the rate limit is only checked when a real SAM.gov API call will be made (i.e., when `SAM_API_KEY` is configured). Mock data responses skip the rate limit.

**3. Frontend -- `src/hooks/useSearch.tsx`**

Update the error handling to detect 429 responses and show a user-friendly toast:

```typescript
// In the search function's error handling
if (error.message?.includes('Rate limit exceeded') || error.status === 429) {
  toast.error("Daily search limit reached. Your limit resets at midnight UTC.");
}
```

### Summary of files changed
| File | Change |
|------|--------|
| Migration SQL | New `api_rate_limits` table + `check_and_increment_rate_limit` function |
| `supabase/functions/sam-search/index.ts` | Add rate limit check after auth, before API call |
| `src/hooks/useSearch.tsx` | Handle 429 rate limit error with toast message |

