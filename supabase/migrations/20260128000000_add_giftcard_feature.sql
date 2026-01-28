-- Migration: Add Gift Card Feature
-- Description: Adds is_giftcard boolean to wishlist_items and creates item_claims table
-- for tracking multiple claims on gift card items

-- Add is_giftcard column to wishlist_items
ALTER TABLE public.wishlist_items 
  ADD COLUMN IF NOT EXISTS is_giftcard BOOLEAN DEFAULT FALSE;

-- Create item_claims table for tracking multiple claims on gift card items
CREATE TABLE IF NOT EXISTS public.item_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  claimer_name TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Prevent the same person from claiming the same item multiple times
  UNIQUE(item_id, claimer_name)
);

-- Create index for faster lookups by item_id
CREATE INDEX IF NOT EXISTS idx_item_claims_item_id ON public.item_claims(item_id);

-- Enable RLS on item_claims
ALTER TABLE public.item_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_claims

-- Anyone can insert a claim (public users via share link)
CREATE POLICY "anyone_can_insert_claims" ON public.item_claims
  FOR INSERT
  WITH CHECK (true);

-- Anyone can read claims (needed for checking if user already claimed)
CREATE POLICY "anyone_can_read_claims" ON public.item_claims
  FOR SELECT
  USING (true);

-- Only admins and owners can delete claims (for untaking items)
CREATE POLICY "admins_can_delete_claims" ON public.item_claims
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlist_items wi
      JOIN public.wishlists w ON wi.wishlist_id = w.id
      LEFT JOIN public.wishlist_admins wa ON w.id = wa.wishlist_id
      WHERE wi.id = item_claims.item_id
        AND (w.creator_id = auth.uid() OR wa.admin_id = auth.uid())
    )
  );

-- Comment on table and columns for documentation
COMMENT ON TABLE public.item_claims IS 'Tracks multiple claims for gift card items that can be claimed by multiple people';
COMMENT ON COLUMN public.item_claims.item_id IS 'Reference to the wishlist item being claimed';
COMMENT ON COLUMN public.item_claims.claimer_name IS 'Name of the person claiming the item';
COMMENT ON COLUMN public.item_claims.claimed_at IS 'When the claim was made';
COMMENT ON COLUMN public.wishlist_items.is_giftcard IS 'If true, this item can be claimed by multiple people (e.g., gift cards, group gifts)';
