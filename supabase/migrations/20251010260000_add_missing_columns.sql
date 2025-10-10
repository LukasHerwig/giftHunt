-- Add missing columns that the frontend expects

-- Add expires_at column to admin_invitations table
ALTER TABLE public.admin_invitations 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Add any other missing columns that might be expected
-- Check if url column exists in wishlist_items (some frontends expect this)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlist_items' AND column_name = 'url') THEN
        ALTER TABLE public.wishlist_items ADD COLUMN url TEXT;
    END IF;
END $$;