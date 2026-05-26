
-- Add viewer/editor roles to workspace_role enum (keep owner & member for back-compat)
ALTER TYPE public.workspace_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE public.workspace_role ADD VALUE IF NOT EXISTS 'editor';
