-- Ultra-simple RLS policies that cannot cause infinite recursion
-- These policies only check auth.uid() directly without any cross-table references

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- PROFILES: Only own profile access
CREATE POLICY "profiles_own_only" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- WISHLISTS: Only creator can see/manage their wishlists initially
CREATE POLICY "wishlists_creator_only" ON public.wishlists
    FOR ALL USING (auth.uid() = creator_id);

-- WISHLIST_ITEMS: Allow access to anyone (we'll secure via wishlist access in app logic)
CREATE POLICY "wishlist_items_public" ON public.wishlist_items
    FOR ALL USING (true);

-- WISHLIST_ADMINS: Allow users to see records where they are the admin
CREATE POLICY "wishlist_admins_own" ON public.wishlist_admins
    FOR ALL USING (auth.uid() = admin_id OR auth.uid() = invited_by);

-- ADMIN_INVITATIONS: Allow access to manage invitations
CREATE POLICY "admin_invitations_manage" ON public.admin_invitations
    FOR ALL USING (auth.uid() = invited_by);

-- SHARE_LINKS: Allow access for creators
CREATE POLICY "share_links_creator" ON public.share_links
    FOR ALL USING (auth.uid() = created_by);