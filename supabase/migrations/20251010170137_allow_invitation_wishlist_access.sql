-- Allow public access to wishlist details for invitation recipients
-- This enables the AcceptInvitation page to load wishlist info even for unauthenticated users

-- Add a policy to allow reading wishlist details if there's a valid invitation
CREATE POLICY "Allow reading wishlist details via invitation"
  ON public.wishlists FOR SELECT
  USING (
    id IN (
      SELECT wishlist_id 
      FROM public.wishlist_invitations 
      WHERE accepted = false 
      AND expires_at > NOW()
    )
  );

-- Allow reading profile info for wishlist owners via invitations
CREATE POLICY "Allow reading profile info via invitation"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT w.user_id
      FROM public.wishlists w
      JOIN public.wishlist_invitations wi ON w.id = wi.wishlist_id
      WHERE wi.accepted = false 
      AND wi.expires_at > NOW()
    )
  );
