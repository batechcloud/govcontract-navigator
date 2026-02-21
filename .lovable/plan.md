

# Fix: My Business Profile Not Saving

## Problem
The save button triggers a Supabase `.upsert()` without specifying the conflict resolution column. Since `id` is auto-generated (and not included in the payload), Supabase always attempts an INSERT, which fails because `user_id` has a unique constraint.

## Solution

### File: `src/pages/CompanyProfile.tsx` (line ~247)

Add `onConflict: 'user_id'` to the upsert call so Supabase knows to UPDATE the existing row when a profile for that user already exists:

```typescript
const { error } = await supabase
  .from("company_profiles")
  .upsert(
    {
      user_id: user.id,
      company_name: formData.company_name || "My Company",
      // ... rest of fields
    },
    { onConflict: "user_id" }  // <-- this is the fix
  );
```

This is a one-line fix. No database changes, no new files needed.

