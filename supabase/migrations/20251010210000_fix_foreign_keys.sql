-- Debug and fix foreign key relationships
-- This migration ensures all foreign keys are properly set up

-- First, let's check and recreate the foreign key constraints to ensure they're correct
-- Drop existing foreign key constraints if they exist
ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS wishlists_creator_id_fkey;
ALTER TABLE public.wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlist_id_fkey;
ALTER TABLE public.wishlist_admins DROP CONSTRAINT IF EXISTS wishlist_admins_wishlist_id_fkey;
ALTER TABLE public.wishlist_admins DROP CONSTRAINT IF EXISTS wishlist_admins_admin_id_fkey;
ALTER TABLE public.wishlist_admins DROP CONSTRAINT IF EXISTS wishlist_admins_invited_by_fkey;
ALTER TABLE public.admin_invitations DROP CONSTRAINT IF EXISTS admin_invitations_wishlist_id_fkey;
ALTER TABLE public.admin_invitations DROP CONSTRAINT IF EXISTS admin_invitations_invited_by_fkey;
ALTER TABLE public.share_links DROP CONSTRAINT IF EXISTS share_links_wishlist_id_fkey;
ALTER TABLE public.share_links DROP CONSTRAINT IF EXISTS share_links_created_by_fkey;

-- Recreate all foreign key constraints with proper names
ALTER TABLE public.wishlists 
    ADD CONSTRAINT wishlists_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_items 
    ADD CONSTRAINT wishlist_items_wishlist_id_fkey 
    FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_admins 
    ADD CONSTRAINT wishlist_admins_wishlist_id_fkey 
    FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_admins 
    ADD CONSTRAINT wishlist_admins_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_admins 
    ADD CONSTRAINT wishlist_admins_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.admin_invitations 
    ADD CONSTRAINT admin_invitations_wishlist_id_fkey 
    FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE;

ALTER TABLE public.admin_invitations 
    ADD CONSTRAINT admin_invitations_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.share_links 
    ADD CONSTRAINT share_links_wishlist_id_fkey 
    FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE;

ALTER TABLE public.share_links 
    ADD CONSTRAINT share_links_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also ensure all required columns exist and have proper types
-- Check if we need to add any missing columns
DO $$
BEGIN
    -- Ensure profiles has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Ensure wishlists has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlists' AND column_name = 'creator_id') THEN
        ALTER TABLE public.wishlists ADD COLUMN creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Ensure wishlist_items has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlist_items' AND column_name = 'description') THEN
        ALTER TABLE public.wishlist_items ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlist_items' AND column_name = 'price_range') THEN
        ALTER TABLE public.wishlist_items ADD COLUMN price_range TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlist_items' AND column_name = 'priority') THEN
        ALTER TABLE public.wishlist_items ADD COLUMN priority INTEGER DEFAULT 2;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlist_items' AND column_name = 'updated_at') THEN
        ALTER TABLE public.wishlist_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;
END
$$;