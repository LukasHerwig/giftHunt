-- Fix share_links RLS policy to allow wishlist owners to delete share links
-- This is needed when removing admins - the wishlist owner should be able to delete
-- share links for their wishlist regardless of who created them

-- Drop the existing policy
DROP POLICY IF EXISTS "share_links_policy" ON public.share_links;

-- Create separate policies for different operations
-- Allow users to view and create share links they created
CREATE POLICY "share_links_own_access" ON public.share_links 
FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "share_links_create" ON public.share_links 
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow wishlist owners to delete share links for their wishlists
-- AND allow users to delete share links they created
CREATE POLICY "share_links_delete" ON public.share_links 
FOR DELETE USING (
  auth.uid() = created_by 
  OR 
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE wishlists.id = share_links.wishlist_id 
    AND wishlists.creator_id = auth.uid()
  )
);

-- Allow users to update share links they created
CREATE POLICY "share_links_update" ON public.share_links 
FOR UPDATE USING (auth.uid() = created_by);