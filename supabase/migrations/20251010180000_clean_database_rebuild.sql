-- Clean database rebuild for wishlist app
-- This migration drops all existing tables and creates a new, clean structure
-- that properly supports the three-role flow: Creators, Admins, and Share Users

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS public.wishlist_invitations CASCADE;
DROP TABLE IF EXISTS public.wishlist_admins CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- 1. PROFILES TABLE
-- Basic user information linked to auth.users
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. WISHLISTS TABLE
-- The core wishlist created by users
CREATE TABLE public.wishlists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- 3. WISHLIST_ITEMS TABLE
-- Individual items in the wishlist
CREATE TABLE public.wishlist_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    price_range TEXT, -- e.g. "$50-100", "Under $25"
    priority INTEGER DEFAULT 1, -- 1 = low, 2 = medium, 3 = high
    is_taken BOOLEAN NOT NULL DEFAULT FALSE,
    taken_by_name TEXT, -- Name of person who reserved it
    taken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- 4. WISHLIST_ADMINS TABLE
-- Defines who can admin a wishlist (only one admin per wishlist for simplicity)
CREATE TABLE public.wishlist_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Only one admin per wishlist
    UNIQUE(wishlist_id)
);

ALTER TABLE public.wishlist_admins ENABLE ROW LEVEL SECURITY;

-- 5. ADMIN_INVITATIONS TABLE
-- Pending invitations to become admin of a wishlist
CREATE TABLE public.admin_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitation_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- One pending invitation per wishlist
    UNIQUE(wishlist_id)
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- 6. SHARE_LINKS TABLE
-- Share links that admins can generate for public access
CREATE TABLE public.share_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Only one active share link per wishlist
    UNIQUE(wishlist_id)
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- FUNCTIONS

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to automatically set taken_at when item is marked as taken
CREATE OR REPLACE FUNCTION public.handle_item_taken()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If item is being marked as taken and wasn't taken before
    IF NEW.is_taken = TRUE AND (OLD.is_taken = FALSE OR OLD.is_taken IS NULL) THEN
        NEW.taken_at = NOW();
    -- If item is being unmarked as taken
    ELSIF NEW.is_taken = FALSE THEN
        NEW.taken_at = NULL;
        NEW.taken_by_name = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- TRIGGERS

-- Create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at
    BEFORE UPDATE ON public.wishlists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wishlist_items_updated_at
    BEFORE UPDATE ON public.wishlist_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Handle item taken status
CREATE TRIGGER handle_wishlist_item_taken
    BEFORE UPDATE ON public.wishlist_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_item_taken();

-- ROW LEVEL SECURITY POLICIES

-- PROFILES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- WISHLISTS
-- Creators can manage their own wishlists
CREATE POLICY "Creators can manage their own wishlists"
    ON public.wishlists FOR ALL
    USING (auth.uid() = creator_id);

-- Admins can view wishlists they admin
CREATE POLICY "Admins can view their admin wishlists"
    ON public.wishlists FOR SELECT
    USING (
        id IN (
            SELECT wishlist_id 
            FROM public.wishlist_admins 
            WHERE admin_id = auth.uid()
        )
    );

-- WISHLIST_ITEMS
-- Creators can see their items BUT NOT the taken status or taken_by_name
-- This is enforced at the application level by filtering these fields
CREATE POLICY "Creators can manage their wishlist items"
    ON public.wishlist_items FOR ALL
    USING (
        wishlist_id IN (
            SELECT id 
            FROM public.wishlists 
            WHERE creator_id = auth.uid()
        )
    );

-- Admins can see ALL items including taken status
CREATE POLICY "Admins can view all items in their admin wishlists"
    ON public.wishlist_items FOR SELECT
    USING (
        wishlist_id IN (
            SELECT wishlist_id 
            FROM public.wishlist_admins 
            WHERE admin_id = auth.uid()
        )
    );

-- Public can view items via share link (handled by share token validation)
CREATE POLICY "Public can view items via share link"
    ON public.wishlist_items FOR SELECT
    USING (TRUE); -- Additional validation done in application layer

-- Public can mark items as taken via share link
CREATE POLICY "Public can mark items as taken via share link"
    ON public.wishlist_items FOR UPDATE
    USING (TRUE) -- Additional validation done in application layer
    WITH CHECK (
        -- Can only update is_taken and taken_by_name fields
        -- Other field changes will be rejected by application logic
        TRUE
    );

-- WISHLIST_ADMINS
-- Creators can manage admins for their wishlists
CREATE POLICY "Creators can manage admins for their wishlists"
    ON public.wishlist_admins FOR ALL
    USING (
        wishlist_id IN (
            SELECT id 
            FROM public.wishlists 
            WHERE creator_id = auth.uid()
        )
    );

-- Admins can view their own admin relationships
CREATE POLICY "Admins can view their admin relationships"
    ON public.wishlist_admins FOR SELECT
    USING (admin_id = auth.uid());

-- ADMIN_INVITATIONS
-- Creators can manage invitations for their wishlists
CREATE POLICY "Creators can manage invitations for their wishlists"
    ON public.admin_invitations FOR ALL
    USING (
        wishlist_id IN (
            SELECT id 
            FROM public.wishlists 
            WHERE creator_id = auth.uid()
        )
    );

-- Anyone can view invitations by token (for accepting)
CREATE POLICY "Anyone can view invitations by token"
    ON public.admin_invitations FOR SELECT
    USING (TRUE);

-- Invited users can accept their invitations
CREATE POLICY "Invited users can accept their invitations"
    ON public.admin_invitations FOR UPDATE
    USING (
        email = (
            SELECT email 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
        AND expires_at > NOW()
        AND accepted = FALSE
    );

-- SHARE_LINKS
-- Only admins can create and manage share links
CREATE POLICY "Admins can manage share links for their wishlists"
    ON public.share_links FOR ALL
    USING (
        wishlist_id IN (
            SELECT wishlist_id 
            FROM public.wishlist_admins 
            WHERE admin_id = auth.uid()
        )
    );

-- Anyone can view share links by token (for public access)
CREATE POLICY "Anyone can view share links by token"
    ON public.share_links FOR SELECT
    USING (TRUE);

-- Add some helpful indexes for performance
CREATE INDEX idx_wishlists_creator_id ON public.wishlists(creator_id);
CREATE INDEX idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_is_taken ON public.wishlist_items(is_taken);
CREATE INDEX idx_wishlist_admins_admin_id ON public.wishlist_admins(admin_id);
CREATE INDEX idx_wishlist_admins_wishlist_id ON public.wishlist_admins(wishlist_id);
CREATE INDEX idx_admin_invitations_email ON public.admin_invitations(email);
CREATE INDEX idx_admin_invitations_token ON public.admin_invitations(invitation_token);
CREATE INDEX idx_share_links_token ON public.share_links(share_token);
CREATE INDEX idx_share_links_wishlist_id ON public.share_links(wishlist_id);