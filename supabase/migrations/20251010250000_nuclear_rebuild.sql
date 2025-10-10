-- NUCLEAR OPTION: Complete database rebuild from scratch
-- This will drop ALL tables and recreate everything clean

-- Drop all tables in dependency order
DROP TABLE IF EXISTS public.share_links CASCADE;
DROP TABLE IF EXISTS public.admin_invitations CASCADE;
DROP TABLE IF EXISTS public.wishlist_admins CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recreate wishlists table
CREATE TABLE public.wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recreate wishlist_items table
CREATE TABLE public.wishlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_range TEXT,
    priority INTEGER DEFAULT 2,
    claimed_by UUID REFERENCES public.profiles(id),
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recreate wishlist_admins table
CREATE TABLE public.wishlist_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(wishlist_id, admin_id)
);

-- Recreate admin_invitations table
CREATE TABLE public.admin_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invitation_token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recreate share_links table
CREATE TABLE public.share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Create the absolute simplest policies possible
-- PROFILES
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL USING (auth.uid() = id);

-- WISHLISTS - Only creator access
CREATE POLICY "wishlists_policy" ON public.wishlists FOR ALL USING (auth.uid() = creator_id);

-- WISHLIST_ITEMS - Public for now (secure via app logic)
CREATE POLICY "wishlist_items_policy" ON public.wishlist_items FOR ALL USING (true);

-- WISHLIST_ADMINS - Basic access
CREATE POLICY "wishlist_admins_policy" ON public.wishlist_admins FOR ALL USING (auth.uid() = admin_id);

-- ADMIN_INVITATIONS - Basic access
CREATE POLICY "admin_invitations_policy" ON public.admin_invitations FOR ALL USING (true);

-- SHARE_LINKS - Basic access
CREATE POLICY "share_links_policy" ON public.share_links FOR ALL USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_admins TO authenticated;
GRANT ALL ON public.admin_invitations TO authenticated;
GRANT ALL ON public.share_links TO authenticated;