-- Fix RLS policies to allow invitation acceptance page to access necessary data
-- This migration adds policies that allow reading profile and wishlist data 
-- when there's a valid invitation token

-- Allow reading profile information for invitees (needed to show who invited them)
-- This policy allows reading any profile if there's a valid pending invitation from that user
CREATE POLICY "allow_profile_read_for_invitations" ON public.profiles
FOR SELECT USING (
  id IN (
    SELECT invited_by 
    FROM public.admin_invitations 
    WHERE accepted = false 
    AND (expires_at IS NULL OR expires_at > NOW())
  )
);

-- Allow reading wishlist information for invitees (needed to show which wishlist they're invited to)
-- This policy allows reading any wishlist if there's a valid pending invitation for it
CREATE POLICY "allow_wishlist_read_for_invitations" ON public.wishlists
FOR SELECT USING (
  id IN (
    SELECT wishlist_id 
    FROM public.admin_invitations 
    WHERE accepted = false 
    AND (expires_at IS NULL OR expires_at > NOW())
  )
);

-- Also ensure that anyone can read invitation data by token (this should already exist but let's be sure)
CREATE POLICY "allow_invitation_read_by_token" ON public.admin_invitations
FOR SELECT USING (true);

-- Add comments to document these policies
COMMENT ON POLICY "allow_profile_read_for_invitations" ON public.profiles 
IS 'Allows reading profile info for users who have sent pending invitations - needed for invitation acceptance page';

COMMENT ON POLICY "allow_wishlist_read_for_invitations" ON public.wishlists 
IS 'Allows reading wishlist info when there are pending invitations - needed for invitation acceptance page';

COMMENT ON POLICY "allow_invitation_read_by_token" ON public.admin_invitations 
IS 'Allows anyone to read invitation data by token - needed for invitation acceptance page';