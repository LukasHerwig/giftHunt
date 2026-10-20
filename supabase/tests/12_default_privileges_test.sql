begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

-- Migrations run as postgres, like this test
create table public.zz_default_privilege_probe (id int);
create sequence public.zz_default_privilege_probe_seq;

select is(
  (select count(*)::int
   from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('anon', 'public.zz_default_privilege_probe', p)),
  0, 'a new table is not granted to anon');

select ok(
  not has_sequence_privilege('anon', 'public.zz_default_privilege_probe_seq', 'USAGE'),
  'a new sequence is not granted to anon');

select * from finish();
rollback;
