-- Enforce one admin per wishlist constraint
-- This migration fixes the wishlist_admins table to only allow one admin per wishlist

-- First, remove any duplicate admin records (keep the oldest one for each wishlist)
-- In case there are multiple admins for the same wishlist, we'll keep the first one created
WITH ranked_admins AS (
  SELECT 
    id,
    wishlist_id,
    admin_id,
    ROW_NUMBER() OVER (PARTITION BY wishlist_id ORDER BY created_at ASC) as rn
  FROM public.wishlist_admins
)
DELETE FROM public.wishlist_admins 
WHERE id IN (
  SELECT id FROM ranked_admins WHERE rn > 1
);

-- Drop the existing constraint that allows multiple admins per wishlist
ALTER TABLE public.wishlist_admins 
DROP CONSTRAINT IF EXISTS wishlist_admins_wishlist_id_admin_id_key;

-- Add the new constraint to enforce one admin per wishlist
ALTER TABLE public.wishlist_admins 
ADD CONSTRAINT wishlist_admins_one_per_wishlist UNIQUE (wishlist_id);

-- Also ensure the admin_invitations table enforces one pending invitation per wishlist
-- (this might already exist but let's make sure)
ALTER TABLE public.admin_invitations 
DROP CONSTRAINT IF EXISTS admin_invitations_wishlist_id_key;

ALTER TABLE public.admin_invitations 
ADD CONSTRAINT admin_invitations_one_per_wishlist UNIQUE (wishlist_id);

-- Add a comment to document the business rule
COMMENT ON CONSTRAINT wishlist_admins_one_per_wishlist ON public.wishlist_admins 
IS 'Enforces business rule: only one admin allowed per wishlist';

COMMENT ON CONSTRAINT admin_invitations_one_per_wishlist ON public.admin_invitations 
IS 'Enforces business rule: only one pending invitation allowed per wishlist';