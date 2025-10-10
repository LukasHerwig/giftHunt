-- Comprehensive RLS policy fix for all tables
-- This migration completely rebuilds all RLS policies to fix 500 errors

-- First, let's disable RLS temporarily on all tables to clear any issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start completely fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Creators can manage their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Admins can view their admin wishlists" ON public.wishlists;

DROP POLICY IF EXISTS "Creators can manage their wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Admins can view all items in their admin wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Public can view items via share link" ON public.wishlist_items;
DROP POLICY IF EXISTS "Public can mark items as taken via share link" ON public.wishlist_items;

DROP POLICY IF EXISTS "Creators can manage admins for their wishlists" ON public.wishlist_admins;
DROP POLICY IF EXISTS "Admins can view their admin relationships" ON public.wishlist_admins;

DROP POLICY IF EXISTS "Creators can manage invitations for their wishlists" ON public.admin_invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.admin_invitations;
DROP POLICY IF EXISTS "Invited users can accept their invitations" ON public.admin_invitations;

DROP POLICY IF EXISTS "Admins can manage share links for their wishlists" ON public.share_links;
DROP POLICY IF EXISTS "Anyone can view share links by token" ON public.share_links;

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- PROFILES: Simple user access
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- WISHLISTS: Creators can do everything, admins can only view
CREATE POLICY "wishlists_all_creator" ON public.wishlists
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "wishlists_select_admin" ON public.wishlists
    FOR SELECT USING (
        auth.uid() IN (
            SELECT admin_id FROM public.wishlist_admins 
            WHERE wishlist_id = id
        )
    );

-- WISHLIST_ITEMS: Creators manage, admins view, public via share links
CREATE POLICY "items_all_creator" ON public.wishlist_items
    FOR ALL USING (
        wishlist_id IN (
            SELECT id FROM public.wishlists 
            WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "items_select_admin" ON public.wishlist_items
    FOR SELECT USING (
        wishlist_id IN (
            SELECT wishlist_id FROM public.wishlist_admins 
            WHERE admin_id = auth.uid()
        )
    );

CREATE POLICY "items_select_public" ON public.wishlist_items
    FOR SELECT USING (
        wishlist_id IN (
            SELECT wishlist_id FROM public.share_links 
            WHERE is_active = true 
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "items_update_public" ON public.wishlist_items
    FOR UPDATE USING (
        wishlist_id IN (
            SELECT wishlist_id FROM public.share_links 
            WHERE is_active = true 
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- WISHLIST_ADMINS: Creators manage, admins view themselves
CREATE POLICY "admins_all_creator" ON public.wishlist_admins
    FOR ALL USING (
        wishlist_id IN (
            SELECT id FROM public.wishlists 
            WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "admins_select_self" ON public.wishlist_admins
    FOR SELECT USING (admin_id = auth.uid());

-- ADMIN_INVITATIONS: Creators manage, anyone can view/accept by token
CREATE POLICY "invitations_all_creator" ON public.admin_invitations
    FOR ALL USING (
        wishlist_id IN (
            SELECT id FROM public.wishlists 
            WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "invitations_select_all" ON public.admin_invitations
    FOR SELECT USING (true);

CREATE POLICY "invitations_update_invited" ON public.admin_invitations
    FOR UPDATE USING (
        email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        AND expires_at > NOW()
        AND accepted = false
    );

-- SHARE_LINKS: Only admins can manage, anyone can view by token
CREATE POLICY "share_links_all_admin" ON public.share_links
    FOR ALL USING (
        wishlist_id IN (
            SELECT wishlist_id FROM public.wishlist_admins 
            WHERE admin_id = auth.uid()
        )
    );

CREATE POLICY "share_links_select_all" ON public.share_links
    FOR SELECT USING (true);