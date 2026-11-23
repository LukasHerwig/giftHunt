-- List helpers: a self-managed list can have several helpers (extra wishlist_admins rows
-- and invitations). Ordinary lists keep exactly one organizer and one invitation, now
-- enforced by triggers instead of UNIQUE(wishlist_id).
create or replace function public.is_self_managed(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_self_managed from wishlists where id = p_wishlist_id), false);
$$;

revoke execute on function public.is_self_managed(uuid) from public, anon;
grant execute on function public.is_self_managed(uuid) to authenticated, service_role;

alter table public.wishlist_admins drop constraint wishlist_admins_one_per_wishlist;
alter table public.wishlist_admins add constraint wishlist_admins_wishlist_admin_key unique (wishlist_id, admin_id);

alter table public.admin_invitations drop constraint admin_invitations_one_per_wishlist;
create unique index admin_invitations_pending_email
  on public.admin_invitations (wishlist_id, lower(email)) where not accepted;

alter table public.admin_invitations
  add column accepted_by uuid references auth.users on delete set null;

-- Ordinary list: one organizer. The wishlist row is locked so two concurrent inserts queue.
create or replace function public.enforce_one_admin_per_ordinary_list()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform 1 from wishlists where id = new.wishlist_id for no key update;
  if not public.is_self_managed(new.wishlist_id)
     and exists (select 1 from wishlist_admins
                 where wishlist_id = new.wishlist_id and admin_id <> new.admin_id) then
    raise exception 'admin_already_exists' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_one_admin_per_ordinary_list() from public, anon, authenticated;

create trigger wishlist_admins_one_per_ordinary_list
  before insert on public.wishlist_admins
  for each row execute function public.enforce_one_admin_per_ordinary_list();

-- Ordinary list: any invitation row blocks a new one (as UNIQUE(wishlist_id) did).
-- Self-managed list: not the creator's own address, not someone who already helps.
-- BEFORE triggers run before RLS, so the owner check comes first: nobody else may
-- learn from these errors (auth.uid() is null only for service_role/postgres).
create or replace function public.admin_invitations_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_wishlist_owner(new.wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  perform 1 from wishlists where id = new.wishlist_id for no key update;
  if not public.is_self_managed(new.wishlist_id) then
    if exists (select 1 from admin_invitations where wishlist_id = new.wishlist_id) then
      raise exception 'duplicate key value violates unique constraint "admin_invitations_one_per_ordinary_list"'
        using errcode = '23505';
    end if;
    return new;
  end if;
  if exists (select 1 from wishlists w join profiles p on p.id = w.creator_id
             where w.id = new.wishlist_id and lower(p.email) = lower(new.email)) then
    raise exception 'cannot_invite_self' using errcode = 'P0001';
  end if;
  if exists (select 1 from wishlist_admins a join profiles p on p.id = a.admin_id
             where a.wishlist_id = new.wishlist_id and lower(p.email) = lower(new.email)) then
    raise exception 'already_helper' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.admin_invitations_rules() from public, anon, authenticated;

create trigger admin_invitations_rules
  before insert on public.admin_invitations
  for each row execute function public.admin_invitations_rules();

create or replace function public.accept_invitation(p_invitation_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_inv admin_invitations%rowtype;
  v_wishlist_id uuid;
begin
  -- Lock the wishlist before the invitation (same order as archive_wishlist and the
  -- wishlist_admins trigger), so the two cannot deadlock.
  select wishlist_id into v_wishlist_id from admin_invitations where id = p_invitation_id;
  perform 1 from wishlists where id = v_wishlist_id for no key update;
  select * into v_inv from admin_invitations where id = p_invitation_id for update;
  -- is distinct from: a JWT without an email claim must not pass the check.
  if not found or lower(v_inv.email) is distinct from lower(auth.jwt() ->> 'email') then
    raise exception 'invitation_not_found' using errcode = 'P0002';
  end if;
  -- The email claim is only trustworthy once the address is confirmed.
  if not exists (select 1 from auth.users
                 where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'email_not_confirmed' using errcode = 'P0001';
  end if;
  if public.is_wishlist_owner(v_inv.wishlist_id) then
    raise exception 'owner_cannot_be_admin' using errcode = 'P0001';
  end if;
  if v_inv.accepted then
    raise exception 'already_accepted' using errcode = 'P0001';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  -- Insert the admin row for the caller directly (the old acceptance trigger is
  -- dropped: it matched email case-sensitively).
  insert into wishlist_admins (wishlist_id, admin_id, invited_by)
  values (v_inv.wishlist_id, auth.uid(), v_inv.invited_by)
  on conflict (wishlist_id, admin_id) do nothing;

  -- The wishlist may already have a different admin; do not report success then.
  if not exists (select 1 from wishlist_admins
                 where wishlist_id = v_inv.wishlist_id and admin_id = auth.uid()) then
    raise exception 'admin_already_exists' using errcode = 'P0001';
  end if;

  update admin_invitations set accepted = true, accepted_by = auth.uid() where id = p_invitation_id;
end;
$$;

-- ============================================================================
-- Task 2: what helpers may do
-- A helper (extra wishlist_admins row on a self-managed list) may add, edit and
-- delete items and remove claims. The share link, the list itself and
-- invitations stay with the creator.
-- ============================================================================

create policy "items_helper_insert" on public.wishlist_items
  for insert to authenticated
  with check (public.is_wishlist_admin(wishlist_id)
              and public.is_self_managed(wishlist_id)
              and not public.wishlist_is_archived(wishlist_id));

drop policy if exists "share_links_admin_insert" on public.share_links;
drop policy if exists "share_links_admin_update" on public.share_links;
drop policy if exists "share_links_admin_delete" on public.share_links;

create policy "share_links_admin_insert" on public.share_links
  for insert to authenticated
  with check (public.is_wishlist_admin(wishlist_id) and created_by = auth.uid()
              and not public.wishlist_is_archived(wishlist_id)
              and (not public.is_self_managed(wishlist_id) or public.is_wishlist_owner(wishlist_id)));

create policy "share_links_admin_update" on public.share_links
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id)
         and (not public.is_self_managed(wishlist_id) or public.is_wishlist_owner(wishlist_id)))
  with check (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id)
              and (not public.is_self_managed(wishlist_id) or public.is_wishlist_owner(wishlist_id)));

create policy "share_links_admin_delete" on public.share_links
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id)
         and (not public.is_self_managed(wishlist_id) or public.is_wishlist_owner(wishlist_id)));

-- Guest page: on a self-managed list the organizer shown is the creator.
create or replace function public.get_shared_wishlist(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_link share_links%rowtype;
begin
  select * into v_link from share_links where token = p_token;
  if not found then
    raise exception 'invalid_link' using errcode = 'P0002';
  end if;
  if not v_link.is_active then
    raise exception 'inactive_link' using errcode = 'P0001';
  end if;
  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'expired_link' using errcode = 'P0001';
  end if;

  return json_build_object(
    'wishlist', (
      select json_build_object(
        'title', w.title,
        'description', w.description,
        'enable_links', w.enable_links,
        'enable_price', w.enable_price,
        'enable_priority', w.enable_priority,
        'creator_name', p.full_name,
        'organizer_name', (
          select pa.full_name
          from wishlist_admins wa
          join profiles pa on pa.id = wa.admin_id
          where wa.wishlist_id = w.id
            and (not w.is_self_managed or wa.admin_id = w.creator_id)))
      from wishlists w
      left join profiles p on p.id = w.creator_id
      where w.id = v_link.wishlist_id),
    'items', coalesce((
      select json_agg(json_build_object(
          'id', i.id,
          'title', i.title,
          'description', i.description,
          'link', i.link,
          'url', i.url,
          'price_range', i.price_range,
          'priority', i.priority,
          'is_taken', i.is_taken,
          'is_giftcard', i.is_giftcard,
          'claim_cap', i.claim_cap,
          'claim_count', (select count(*) from item_claims c where c.item_id = i.id))
        order by i.priority desc nulls first, i.created_at desc)
      from wishlist_items i
      where i.wishlist_id = v_link.wishlist_id), '[]'::json),
    'share_link', json_build_object(
      'wishlist_id', v_link.wishlist_id,
      'expires_at', v_link.expires_at)
  );
end;
$$;

create or replace function public.get_invitation_by_token(p_token text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', ai.id,
    'email', ai.email,
    'accepted', ai.accepted,
    'expires_at', ai.expires_at,
    'invited_by', ai.invited_by,
    'wishlist_id', ai.wishlist_id,
    'wishlist_title', w.title,
    'wishlist_description', w.description,
    'is_self_managed', w.is_self_managed,
    'inviter_email', p.email,
    'inviter_full_name', p.full_name)
  from admin_invitations ai
  join wishlists w on w.id = ai.wishlist_id
  left join profiles p on p.id = ai.invited_by
  where ai.invitation_token = p_token;
$$;

-- ============================================================================
-- Removing and leaving
-- ============================================================================

-- The creator removes one helper. Share link, items, taken status and claims stay.
create or replace function public.remove_wishlist_helper(p_wishlist_id uuid, p_admin_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if not public.is_self_managed(p_wishlist_id) then
    raise exception 'not_self_managed' using errcode = 'P0001';
  end if;
  if public.wishlist_is_archived(p_wishlist_id) then
    raise exception 'archived_locked' using errcode = 'P0001';
  end if;
  if p_admin_id = auth.uid() then
    raise exception 'cannot_remove_creator' using errcode = 'P0001';
  end if;

  delete from wishlist_admins where wishlist_id = p_wishlist_id and admin_id = p_admin_id;
  if not found then
    raise exception 'not_helper' using errcode = 'P0002';
  end if;
  delete from admin_invitations where wishlist_id = p_wishlist_id and accepted_by = p_admin_id;
end;
$$;

revoke execute on function public.remove_wishlist_helper(uuid, uuid) from public, anon;
grant execute on function public.remove_wishlist_helper(uuid, uuid) to authenticated, service_role;

-- A helper leaves. The creator is not a helper, so for them this is not_helper.
create or replace function public.leave_wishlist(p_wishlist_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  -- Ordinary lists: the organizer is removed by the owner (remove_wishlist_admin cleans up).
  if not public.is_self_managed(p_wishlist_id) or public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_helper' using errcode = 'P0002';
  end if;

  delete from wishlist_admins where wishlist_id = p_wishlist_id and admin_id = auth.uid();
  if not found then
    raise exception 'not_helper' using errcode = 'P0002';
  end if;
  delete from admin_invitations where wishlist_id = p_wishlist_id and accepted_by = auth.uid();
end;
$$;

revoke execute on function public.leave_wishlist(uuid) from public, anon;
grant execute on function public.leave_wishlist(uuid) to authenticated, service_role;

-- remove_wishlist_admin is for ordinary lists only; a self-managed list uses
-- remove_wishlist_helper. Otherwise as in 20261023000023_archive_wishlists.sql.
create or replace function public.remove_wishlist_admin(p_wishlist_id uuid)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_email text;
  v_had_links boolean;
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if public.wishlist_is_archived(p_wishlist_id) then
    raise exception 'archived_locked' using errcode = 'P0001';
  end if;
  if public.is_self_managed(p_wishlist_id) then
    raise exception 'self_managed' using errcode = 'P0001';
  end if;

  select p.email into v_email
  from wishlist_admins wa
  join profiles p on p.id = wa.admin_id
  where wa.wishlist_id = p_wishlist_id;

  with deleted as (
    delete from share_links where wishlist_id = p_wishlist_id returning 1
  )
  select count(*) > 0 into v_had_links from deleted;

  update wishlist_items
  set is_taken = false, taken_by_name = null, taken_at = null
  where wishlist_id = p_wishlist_id and is_taken;

  delete from wishlist_admins where wishlist_id = p_wishlist_id;

  delete from admin_invitations where wishlist_id = p_wishlist_id;

  -- Proposals made to the removed organizer must not be approved by a later one.
  update item_change_requests
  set status = 'withdrawn', resolved_by = auth.uid(), resolved_at = now()
  where wishlist_id = p_wishlist_id and status = 'pending';

  return json_build_object('admin_email', v_email, 'had_share_links', v_had_links);
end;
$$;
