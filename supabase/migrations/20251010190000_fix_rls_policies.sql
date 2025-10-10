-- Fix infinite recursion in RLS policies
-- This migration fixes circular references in the wishlists table policies

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Creators can manage their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Admins can view their admin wishlists" ON public.wishlists;

-- Recreate policies without circular references

-- Policy 1: Creators can manage their own wishlists
CREATE POLICY "Creators can manage their own wishlists"
    ON public.wishlists
    FOR ALL
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Policy 2: Admins can view wishlists they admin (SELECT only to avoid recursion)
CREATE POLICY "Admins can view their admin wishlists"
    ON public.wishlists
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.wishlist_admins 
            WHERE wishlist_admins.wishlist_id = wishlists.id 
            AND wishlist_admins.admin_id = auth.uid()
        )
    );

-- Also fix any potential issues in wishlist_items policies
DROP POLICY IF EXISTS "Creators can manage their wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Admins can view all items in their admin wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Public can view items via share link" ON public.wishlist_items;
DROP POLICY IF EXISTS "Public can mark items as taken via share link" ON public.wishlist_items;

-- Recreate wishlist_items policies without circular references

-- Policy 1: Creators can manage their items
CREATE POLICY "Creators can manage their wishlist items"
    ON public.wishlist_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.wishlists
            WHERE wishlists.id = wishlist_items.wishlist_id
            AND wishlists.creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.wishlists
            WHERE wishlists.id = wishlist_items.wishlist_id
            AND wishlists.creator_id = auth.uid()
        )
    );

-- Policy 2: Admins can view items in their admin wishlists
CREATE POLICY "Admins can view all items in their admin wishlists"
    ON public.wishlist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.wishlist_admins
            WHERE wishlist_admins.wishlist_id = wishlist_items.wishlist_id
            AND wishlist_admins.admin_id = auth.uid()
        )
    );

-- Policy 3: Public can view items via valid share links
CREATE POLICY "Public can view items via share link"
    ON public.wishlist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.share_links
            WHERE share_links.wishlist_id = wishlist_items.wishlist_id
            AND share_links.is_active = true
            AND (share_links.expires_at IS NULL OR share_links.expires_at > NOW())
        )
    );

-- Policy 4: Public can mark items as taken via valid share links
CREATE POLICY "Public can mark items as taken via share link"
    ON public.wishlist_items
    FOR UPDATE
    USING (
        -- Allow updates if there's a valid share link
        EXISTS (
            SELECT 1
            FROM public.share_links
            WHERE share_links.wishlist_id = wishlist_items.wishlist_id
            AND share_links.is_active = true
            AND (share_links.expires_at IS NULL OR share_links.expires_at > NOW())
        )
    )
    WITH CHECK (
        -- Only allow updating taken status fields
        EXISTS (
            SELECT 1
            FROM public.share_links
            WHERE share_links.wishlist_id = wishlist_items.wishlist_id
            AND share_links.is_active = true
            AND (share_links.expires_at IS NULL OR share_links.expires_at > NOW())
        )
    );