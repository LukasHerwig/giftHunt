-- /accept-invitation reads the invitation by its token before the invitee has
-- signed in; accepting requires being signed in with the invited email.

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
    'inviter_email', p.email,
    'inviter_full_name', p.full_name)
  from admin_invitations ai
  join wishlists w on w.id = ai.wishlist_id
  left join profiles p on p.id = ai.invited_by
  where ai.invitation_token = p_token;
$$;

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
  if v_inv.accepted then
    raise exception 'already_accepted' using errcode = 'P0001';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  -- Insert the admin row for the caller directly: the existing trigger looks the
  -- user up by exact email and would miss a differently-cased invitation.
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

alter function public.create_admin_on_invitation_acceptance() security definer set search_path = public;

revoke execute on function public.get_invitation_by_token(text) from public;
revoke execute on function public.accept_invitation(uuid)       from public, anon;
grant execute on function public.get_invitation_by_token(text)  to anon, authenticated, service_role;
grant execute on function public.accept_invitation(uuid)        to authenticated, service_role;
