-- Add configuration options to wishlists table
-- This allows wishlist creators to choose which fields are enabled for their items

ALTER TABLE wishlists ADD COLUMN enable_links BOOLEAN DEFAULT true;
ALTER TABLE wishlists ADD COLUMN enable_price BOOLEAN DEFAULT false;
ALTER TABLE wishlists ADD COLUMN enable_priority BOOLEAN DEFAULT false;

-- Update RLS policies to include new columns (they should inherit from existing policies)
-- No additional RLS changes needed as these are part of the wishlist record