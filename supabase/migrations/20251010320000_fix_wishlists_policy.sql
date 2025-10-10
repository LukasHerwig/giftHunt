-- Update wishlists policy to allow invited admins to read wishlist details
-- Drop the current restrictive policy
DROP POLICY IF EXISTS "wishlists_policy" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_creator_only" ON public.wishlists;

-- Create policies that allow:
-- 1. Creators to fully manage their wishlists
-- 2. Invited admins to read wishlist details
CREATE POLICY "wishlists_creator_access" ON public.wishlists
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "wishlists_admin_read" ON public.wishlists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wishlist_admins 
            WHERE wishlist_id = id AND admin_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.admin_invitations 
            WHERE wishlist_id = id AND email = (
                SELECT email FROM public.profiles WHERE id = auth.uid()
            )
        )
    );