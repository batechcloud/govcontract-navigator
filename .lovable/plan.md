

## Plan: Add UPDATE RLS Policies

Add missing UPDATE policies to two tables so users can update their own records.

### Database Migration

Single migration with two policy additions:

```sql
CREATE POLICY "Users can update their competitor awards"
ON public.competitor_awards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.user_documents FOR UPDATE
USING (auth.uid() = user_id);
```

No code changes required — these tables already use the Supabase client which will automatically benefit from the new policies.

