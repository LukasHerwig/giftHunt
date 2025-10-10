-- Add missing columns to wishlist_items for frontend compatibility
-- The frontend expects is_taken, taken_by_name, taken_at columns
-- but our nuclear rebuild created claimed_by, claimed_at columns

-- Add the missing columns
ALTER TABLE public.wishlist_items 
ADD COLUMN is_taken BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.wishlist_items 
ADD COLUMN taken_by_name TEXT;

ALTER TABLE public.wishlist_items 
ADD COLUMN taken_at TIMESTAMP WITH TIME ZONE;

-- Add the link column if it doesn't exist (frontend expects this too)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlist_items' AND column_name = 'link') THEN
        ALTER TABLE public.wishlist_items ADD COLUMN link TEXT;
    END IF;
END $$;