-- Re-enable RLS on profiles and wishlists tables with proper policies
-- These tables were temporarily disabled but need proper security

-- Re-enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;

-- Create proper policies for profiles
-- Users can view and update their own profile
CREATE POLICY "users_can_access_own_profile" ON public.profiles 
FOR ALL USING (auth.uid() = id);

-- Re-enable RLS on wishlists table  
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "wishlists_policy" ON public.wishlists;

-- Create proper policies for wishlists
-- Creators can manage their own wishlists
CREATE POLICY "creators_can_manage_wishlists" ON public.wishlists 
FOR ALL USING (auth.uid() = creator_id);

-- Admins can read wishlists they're admin of
CREATE POLICY "admins_can_read_wishlists" ON public.wishlists 
FOR SELECT USING (
  id IN (
    SELECT wishlist_id 
    FROM public.wishlist_admins 
    WHERE admin_id = auth.uid()
  )
);

-- Anyone can read wishlists via valid share links (for public access)
-- This is needed for the public wishlist page to work
CREATE POLICY "public_can_read_via_share_links" ON public.wishlists 
FOR SELECT USING (
  id IN (
    SELECT wishlist_id 
    FROM public.share_links 
    WHERE token IS NOT NULL
  )
);