-- An owner can invite their own address; accepting would make them organizer of their own list.
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
  -- dropped below: it matched email case-sensitively).
  insert into wishlist_admins (wishlist_id, admin_id, invited_by)
  values (v_inv.wishlist_id, auth.uid(), v_inv.invited_by)
  on conflict (wishlist_id) do nothing;

  -- The wishlist may already have a different admin; do not report success then.
  if not exists (select 1 from wishlist_admins
                 where wishlist_id = v_inv.wishlist_id and admin_id = auth.uid()) then
    raise exception 'admin_already_exists' using errcode = 'P0001';
  end if;

  update admin_invitations set accepted = true where id = p_invitation_id;
end;
$$;
