-- Drop the old policy that restricts owners from seeing taken items
DROP POLICY IF EXISTS "Owners can view non-taken items in their wishlists" ON public.wishlist_items;

-- Create new policy that allows owners to see ALL items in their wishlists (including taken ones)
CREATE POLICY "Owners can view all items in their wishlists"
  ON public.wishlist_items FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );