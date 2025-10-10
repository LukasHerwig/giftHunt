-- Manual migration to allow owners to see ALL items in their wishlists
-- Run this in your Supabase SQL Editor

-- Drop both the old and potentially existing new policies
DROP POLICY IF EXISTS "Owners can view non-taken items in their wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Owners can view all items in their wishlists" ON public.wishlist_items;

-- Create new policy that allows owners to see ALL items in their wishlists (including taken ones)
CREATE POLICY "Owners can view all items in their wishlists"
  ON public.wishlist_items FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Let's also check what policies currently exist (optional - just for debugging)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'wishlist_items';