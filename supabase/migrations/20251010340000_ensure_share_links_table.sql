-- Ensure share_links table exists with correct structure
-- Drop and recreate to ensure consistency

DROP TABLE IF EXISTS public.share_links CASCADE;

CREATE TABLE public.share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Create policy for share links
CREATE POLICY "share_links_policy" ON public.share_links FOR ALL USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON public.share_links TO authenticated;