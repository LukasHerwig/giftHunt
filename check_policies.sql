-- Check existing policies on wishlist_items table
-- Run this in your Supabase SQL Editor to see what policies currently exist

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'wishlist_items';