-- Grant necessary privileges to the anon role so public share links work locally.
-- In production Supabase projects these grants are applied automatically, but they
-- are not carried over after a local `db reset` unless explicitly present in migrations.

-- Required for reading wishlist data on the public share link page
GRANT SELECT ON public.wishlists TO anon;
GRANT SELECT ON public.wishlist_items TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.item_claims TO anon;

-- Required by wishlists RLS policies that subquery these tables when evaluating
-- row-level access for anon (anon sees no rows due to their own RLS, but the
-- SELECT privilege on the tables is still required to execute the subquery)
GRANT SELECT ON public.wishlist_admins TO anon;
GRANT SELECT ON public.admin_invitations TO anon;

-- anon users need to claim items (INSERT item_claims for giftcards, UPDATE wishlist_items for regular)
GRANT INSERT ON public.item_claims TO anon;
GRANT UPDATE ON public.wishlist_items TO anon;

-- item_claims was added after the default grants ran, so authenticated is also missing DML
GRANT SELECT, INSERT, DELETE ON public.item_claims TO authenticated;
