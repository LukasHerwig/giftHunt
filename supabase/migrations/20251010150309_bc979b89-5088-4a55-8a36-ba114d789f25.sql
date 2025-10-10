-- Drop the existing restrictive policy for owners viewing items
DROP POLICY IF EXISTS "Owners can view non-taken items in their wishlists" ON public.wishlist_items;

-- Create a new policy that allows owners to view ALL items in their wishlists (both taken and non-taken)
CREATE POLICY "Owners can view all items in their wishlists"
ON public.wishlist_items
FOR SELECT
USING (
  wishlist_id IN (
    SELECT id 
    FROM wishlists 
    WHERE user_id = auth.uid()
  )
);