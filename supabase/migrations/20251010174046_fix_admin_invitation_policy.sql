-- Fix the policy to allow creation of admin relationship when invitation is still pending
-- but being accepted by the right user

DROP POLICY IF EXISTS "Invited users can accept admin roles" ON public.wishlist_admins;

CREATE POLICY "Invited users can accept admin roles"
  ON public.wishlist_admins FOR INSERT
  WITH CHECK (
    -- User can only create admin relationship for themselves
    admin_user_id = auth.uid() 
    AND
    -- There must be a valid, pending invitation for this user and wishlist
    EXISTS (
      SELECT 1 
      FROM public.wishlist_invitations wi
      WHERE wi.wishlist_id = wishlist_admins.wishlist_id
        AND wi.email = (
          SELECT email 
          FROM public.profiles 
          WHERE id = auth.uid()
        )
        AND wi.accepted = false  -- Still pending, about to be accepted
        AND wi.expires_at > NOW()
    )
  );
