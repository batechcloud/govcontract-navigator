
-- Enforce one workspace per user so my_workspace_id() is deterministic
-- First, remove any duplicate workspace_members keeping the earliest (owner-preferred)
WITH ranked AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY (role = 'owner') DESC, created_at ASC
    ) AS rn
  FROM public.workspace_members
)
DELETE FROM public.workspace_members wm
USING ranked r
WHERE wm.id = r.id AND r.rn > 1;

ALTER TABLE public.workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_user_id_unique;
ALTER TABLE public.workspace_members
  ADD CONSTRAINT workspace_members_user_id_unique UNIQUE (user_id);
