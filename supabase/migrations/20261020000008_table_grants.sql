-- Anonymous users reach data only through the token RPCs (get_shared_wishlist,
-- claim_shared_item, get_invitation_by_token). Grants are explicit because
-- Supabase stops auto-granting new public tables on 2026-10-30.
revoke all on public.wishlists, public.wishlist_items, public.item_claims, public.share_links,
              public.wishlist_admins, public.admin_invitations, public.profiles
  from anon;

grant select, insert, update, delete
  on public.wishlists, public.wishlist_items, public.item_claims, public.share_links,
     public.wishlist_admins, public.admin_invitations, public.profiles
  to authenticated, service_role;
