-- Create wishlist_admins table to handle admin relationships
CREATE TABLE public.wishlist_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one admin per user per wishlist
  UNIQUE(wishlist_id, admin_user_id)
);

ALTER TABLE public.wishlist_admins ENABLE ROW LEVEL SECURITY;

-- Create invitations table for pending admin invitations
CREATE TABLE public.wishlist_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Ensure one pending invitation per email per wishlist
  UNIQUE(wishlist_id, email)
);

ALTER TABLE public.wishlist_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist_admins
-- Wishlist owners can see admins of their wishlists
CREATE POLICY "Owners can view admins of their wishlists"
  ON public.wishlist_admins FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Admins can see themselves in the admin relationship
CREATE POLICY "Admins can view their own admin relationships"
  ON public.wishlist_admins FOR SELECT
  USING (admin_user_id = auth.uid());

-- Only wishlist owners can add admins
CREATE POLICY "Owners can add admins to their wishlists"
  ON public.wishlist_admins FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Only wishlist owners can remove admins
CREATE POLICY "Owners can remove admins from their wishlists"
  ON public.wishlist_admins FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for wishlist_invitations
-- Wishlist owners can see invitations they sent
CREATE POLICY "Owners can view their sent invitations"
  ON public.wishlist_invitations FOR SELECT
  USING (invited_by = auth.uid());

-- Anyone can view invitations by token (for accepting)
CREATE POLICY "Anyone can view invitations by token"
  ON public.wishlist_invitations FOR SELECT
  USING (TRUE);

-- Only wishlist owners can create invitations
CREATE POLICY "Owners can create invitations"
  ON public.wishlist_invitations FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Only wishlist owners can update invitations (e.g., mark as accepted)
CREATE POLICY "Owners can update invitations"
  ON public.wishlist_invitations FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Update existing RLS policies for wishlist_items to include admin access
-- Drop existing policies first
DROP POLICY IF EXISTS "Owners can view all items in their wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Anyone can view wishlist items" ON public.wishlist_items;

-- Create new policies that include admin access
-- Owners can see all items (without taken status - handled in frontend)
CREATE POLICY "Owners can view their wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Admins can see all items including taken status
CREATE POLICY "Admins can view wishlist items with taken status"
  ON public.wishlist_items FOR SELECT
  USING (
    wishlist_id IN (
      SELECT wa.wishlist_id 
      FROM public.wishlist_admins wa 
      WHERE wa.admin_user_id = auth.uid()
    )
  );

-- Anyone can view items in wishlists (for public sharing)
CREATE POLICY "Anyone can view wishlist items for public sharing"
  ON public.wishlist_items FOR SELECT
  USING (TRUE);