-- An invitee can turn an invitation down. Only the owner could delete invitations
-- before, so a declined invitation would have stayed (and blocked inviting
-- someone else, since a list has at most one invitation). Same identity checks as
-- accept_invitation: the invitation must be addressed to the caller's confirmed e-mail.
create or replace function public.decline_invitation(p_invitation_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_inv admin_invitations%rowtype;
begin
  select * into v_inv from admin_invitations where id = p_invitation_id for update;
  -- is distinct from: a JWT without an email claim must not pass the check.
  if not found or lower(v_inv.email) is distinct from lower(auth.jwt() ->> 'email') then
    raise exception 'invitation_not_found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from auth.users
                 where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'email_not_confirmed' using errcode = 'P0001';
  end if;
  if v_inv.accepted then
    raise exception 'already_accepted' using errcode = 'P0001';
  end if;

  delete from admin_invitations where id = p_invitation_id;
end;
$$;

revoke execute on function public.decline_invitation(uuid) from public, anon;
grant execute on function public.decline_invitation(uuid) to authenticated, service_role;
