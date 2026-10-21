-- One share link per list: the app already creates at most one and reads the oldest,
-- but nothing in the database stopped a double tap from making two.
-- Stray duplicates (never shown to anyone, the page uses the oldest) are removed first,
-- keeping the oldest link of each list, so the index can be created.
delete from public.share_links s
using public.share_links older
where older.wishlist_id = s.wishlist_id
  and (older.created_at, older.id) < (s.created_at, s.id);

create unique index share_links_wishlist_id_key on public.share_links (wishlist_id);
