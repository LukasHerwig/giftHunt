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
  perform 1 from wishlists where id = new.wishlist_id for update;
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
create or replace function public.admin_invitations_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform 1 from wishlists where id = new.wishlist_id for update;
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
begin
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
