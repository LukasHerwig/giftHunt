-- Once a list is shared, the owner's edits and removals become requests the
-- organizer approves (spec section 3). Reads go through RLS; writes only through
-- request_item_change / withdraw_change_request / resolve_change_request.
create table public.item_change_requests (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  -- set null, not cascade: an approved removal deletes the item but the owner
  -- should still see the outcome
  item_id uuid references public.wishlist_items(id) on delete set null,
  item_title text not null,
  kind text not null check (kind in ('edit', 'remove')),
  proposed jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  message text check (message is null or length(message) <= 500),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  constraint item_change_requests_proposed_matches_kind
    check ((kind = 'edit') = (proposed is not null))
);

create index item_change_requests_wishlist_status_idx
  on public.item_change_requests (wishlist_id, status);

create unique index item_change_requests_one_pending_per_item
  on public.item_change_requests (item_id)
  where status = 'pending';

alter table public.item_change_requests enable row level security;

create policy "change_requests_owner_read" on public.item_change_requests
  for select to authenticated
  using (public.is_wishlist_owner(wishlist_id));

create policy "change_requests_admin_read" on public.item_change_requests
  for select to authenticated
  using (public.is_wishlist_admin(wishlist_id));

revoke all on public.item_change_requests from anon, authenticated;
grant select on public.item_change_requests to authenticated;
grant select, insert, update, delete on public.item_change_requests to service_role;
