-- Allow invited users to accept admin roles by creating admin relationships
-- This policy allows users to insert admin records for themselves when they have a valid invitation

CREATE POLICY "Invited users can accept admin roles"
  ON public.wishlist_admins FOR INSERT
  WITH CHECK (
    -- User can only create admin relationship for themselves
    admin_user_id = auth.uid() 
    AND
    -- There must be a valid, accepted invitation for this user and wishlist
    EXISTS (
      SELECT 1 
      FROM public.wishlist_invitations wi
      WHERE wi.wishlist_id = wishlist_admins.wishlist_id
        AND wi.email = (
          SELECT email 
          FROM public.profiles 
          WHERE id = auth.uid()
        )
        AND wi.accepted = true
        AND wi.expires_at > NOW()
    )
  );
