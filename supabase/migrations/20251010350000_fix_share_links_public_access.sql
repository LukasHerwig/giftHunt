-- Fix share_links RLS policy to allow public access for reading
-- Public users need to be able to read share links to access wishlists

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "share_links_policy" ON public.share_links;

-- Create new policies
-- Creators can manage their share links
CREATE POLICY "creators_can_manage_share_links" ON public.share_links 
FOR ALL USING (auth.uid() = created_by);

-- Anyone (including unauthenticated users) can read share links
CREATE POLICY "anyone_can_read_share_links" ON public.share_links 
FOR SELECT USING (true);

-- Grant permissions to anon users as well
GRANT SELECT ON public.share_links TO anon;