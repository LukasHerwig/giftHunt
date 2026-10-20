-- is_self_managed is chosen when the list is created and never changes: flipping it
-- on later would let an owner become their own admin and read who bought what.
create or replace function public.prevent_is_self_managed_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_self_managed is distinct from old.is_self_managed then
    raise exception 'is_self_managed_locked' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_is_self_managed_change() from public, anon, authenticated;

create trigger wishlists_lock_is_self_managed
  before update of is_self_managed on public.wishlists
  for each row execute function public.prevent_is_self_managed_change();
