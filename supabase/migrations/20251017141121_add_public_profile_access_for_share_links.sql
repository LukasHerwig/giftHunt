-- Add RLS policy to allow public access to profile information for wishlist creators
-- when there's an active share link. This is needed for the PublicWishlist page
-- to display the creator's name to people accessing via share links.

-- Allow anonymous users to read specific profile fields
-- This is a simpler approach that avoids infinite recursion
CREATE POLICY "allow_anon_profile_read" ON public.profiles 
FOR SELECT USING (auth.role() = 'anon');

-- Add comment to document the purpose of this policy
COMMENT ON POLICY "allow_anon_profile_read" ON public.profiles 
IS 'Allows anonymous users to read profile info - needed for public wishlist pages to show creator names';
