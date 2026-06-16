-- Allow a wishlist creator to also act as their own admin (e.g. managing a baby shower list)
ALTER TABLE wishlists
  ADD COLUMN IF NOT EXISTS is_self_managed BOOLEAN NOT NULL DEFAULT FALSE;
