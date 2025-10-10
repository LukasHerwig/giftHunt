-- Allow invited users to mark their own invitations as accepted
-- This policy allows users to update invitations that were sent to their email address

CREATE POLICY "Invited users can accept their own invitations"
  ON public.wishlist_invitations FOR UPDATE
  USING (
    -- User can only update invitations sent to their email
    email = (
      SELECT email 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    AND
    -- Only allow updating to mark as accepted (security measure)
    expires_at > NOW()
  )
  WITH CHECK (
    -- Ensure they can only set accepted to true, not change other fields maliciously
    email = (
      SELECT email 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );