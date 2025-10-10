-- Allow admins to read wishlist details for wishlists they have admin access to
-- This enables the Dashboard to display admin wishlists properly

CREATE POLICY "Admins can read wishlist details for their admin wishlists"
  ON public.wishlists FOR SELECT
  USING (
    id IN (
      SELECT wishlist_id 
      FROM public.wishlist_admins 
      WHERE admin_user_id = auth.uid()
    )
  );
