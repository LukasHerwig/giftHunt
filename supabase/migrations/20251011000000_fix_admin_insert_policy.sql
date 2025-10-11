-- Fix admin insert policy to allow invited users to create their own admin records
-- This allows the invited user to create an admin record for themselves when accepting an invitation

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "wishlist_admins_insert_creator" ON public.wishlist_admins;

-- Create a new policy that allows both:
-- 1. Wishlist creators to add admin records (for manual admin management)
-- 2. Invited users to create admin records for themselves when accepting invitations
CREATE POLICY "wishlist_admins_insert_allowed" ON public.wishlist_admins
    FOR INSERT WITH CHECK (
        -- Allow wishlist creators to add admin records
        EXISTS (
            SELECT 1 FROM public.wishlists 
            WHERE id = wishlist_id AND creator_id = auth.uid()
        )
        OR
        -- Allow invited users to create admin records for themselves when accepting invitations
        (
            admin_id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM public.admin_invitations
                WHERE wishlist_id = wishlist_admins.wishlist_id
                AND email = (
                    SELECT email FROM public.profiles WHERE id = auth.uid()
                )
                AND accepted = true
                AND expires_at > NOW()
            )
        )
    );