-- Fix RLS policy on wishlist_admins to allow creators to see admins of their wishlists
-- The current policy only allows admins to see their own records, but creators should
-- be able to see who is admin of their wishlists

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "wishlist_admins_policy" ON public.wishlist_admins;

-- Create a new policy that allows both:
-- 1. Admins to see their own admin records
-- 2. Wishlist creators to see admin records for their wishlists
CREATE POLICY "wishlist_admins_access" ON public.wishlist_admins
FOR ALL USING (
  -- Allow admins to see their own records
  auth.uid() = admin_id
  OR
  -- Allow wishlist creators to see admin records for their wishlists
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE id = wishlist_id AND creator_id = auth.uid()
  )
);

-- Add comment to document the policy
COMMENT ON POLICY "wishlist_admins_access" ON public.wishlist_admins 
IS 'Allows admins to see their own records and wishlist creators to see admin records for their wishlists';