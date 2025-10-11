-- Fix infinite recursion in wishlist_admins RLS policy
-- The current policy causes recursion by checking wishlists table which may reference back to wishlist_admins
-- We'll use a simpler approach that avoids cross-table references

-- Drop the problematic policy
DROP POLICY IF EXISTS "wishlist_admins_access" ON public.wishlist_admins;

-- Create a simple policy that allows both admins and creators to see admin records
-- We'll use the invited_by field to allow the creator (who sent the invitation) to see the admin record
CREATE POLICY "wishlist_admins_simple_access" ON public.wishlist_admins
FOR ALL USING (
  -- Allow admins to see their own records
  auth.uid() = admin_id
  OR
  -- Allow the person who invited the admin to see the admin record
  auth.uid() = invited_by
);

-- Add comment to document the policy
COMMENT ON POLICY "wishlist_admins_simple_access" ON public.wishlist_admins 
IS 'Allows admins to see their own records and inviters to see admin records they created - avoids recursion';