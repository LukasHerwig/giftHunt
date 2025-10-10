-- Complete RLS policy reset to eliminate infinite recursion
-- This migration removes ALL policies and recreates them with simple, non-circular logic

-- First, disable RLS temporarily on all tables to clear any active policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean state
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE - Simple policies with no cross-references
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- WISHLISTS TABLE - Simple policies with direct auth.uid() checks only
CREATE POLICY "wishlists_select_creator" ON public.wishlists
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "wishlists_select_admin" ON public.wishlists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wishlist_admins 
            WHERE wishlist_id = id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "wishlists_insert_creator" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "wishlists_update_creator" ON public.wishlists
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "wishlists_delete_creator" ON public.wishlists
    FOR DELETE USING (auth.uid() = creator_id);

-- WISHLIST_ITEMS TABLE - Simple policies based on wishlist access
CREATE POLICY "wishlist_items_select" ON public.wishlist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.wishlist_admins 
            WHERE wishlist_id = wishlist_items.wishlist_id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "wishlist_items_insert_creator" ON public.wishlist_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "wishlist_items_update" ON public.wishlist_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.wishlist_admins 
            WHERE wishlist_id = wishlist_items.wishlist_id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "wishlist_items_delete_creator" ON public.wishlist_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

-- WISHLIST_ADMINS TABLE - Simple policies
CREATE POLICY "wishlist_admins_select" ON public.wishlist_admins
    FOR SELECT USING (
        admin_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "wishlist_admins_insert_creator" ON public.wishlist_admins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "wishlist_admins_delete_creator" ON public.wishlist_admins
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

-- ADMIN_INVITATIONS TABLE - Simple policies
CREATE POLICY "admin_invitations_select" ON public.admin_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "admin_invitations_insert_creator" ON public.admin_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "admin_invitations_update_creator" ON public.admin_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "admin_invitations_delete_creator" ON public.admin_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
    );

-- SHARE_LINKS TABLE - Simple policies
CREATE POLICY "share_links_select" ON public.share_links
    FOR SELECT USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.wishlist_admins 
            WHERE wishlist_id = share_links.wishlist_id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "share_links_insert" ON public.share_links
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.wishlists 
                WHERE id = wishlist_id AND creator_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.wishlist_admins 
                WHERE wishlist_id = share_links.wishlist_id AND admin_id = auth.uid()
            )
        )
    );

CREATE POLICY "share_links_update" ON public.share_links
    FOR UPDATE USING (
        created_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.wishlists 
                WHERE id = wishlist_id AND creator_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.wishlist_admins 
                WHERE wishlist_id = share_links.wishlist_id AND admin_id = auth.uid()
            )
        )
    );

CREATE POLICY "share_links_delete" ON public.share_links
    FOR DELETE USING (
        created_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.wishlists 
                WHERE id = wishlist_id AND creator_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.wishlist_admins 
                WHERE wishlist_id = share_links.wishlist_id AND admin_id = auth.uid()
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_links TO authenticated;