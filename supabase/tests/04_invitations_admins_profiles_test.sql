begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
\ir _seed.psql

-- Stranger
:as_stranger
select is((select count(*)::int from admin_invitations), 0, 'stranger cannot read invitations');
select is((select count(*)::int from profiles), 1, 'stranger only sees their own profile');
select is((select count(*)::int from wishlist_admins), 0, 'stranger sees no admin rows');
update admin_invitations set accepted = true where id = :'inv_w2';
reset role;
select ok(not (select accepted from admin_invitations where id = :'inv_w2'), 'stranger cannot accept someone else''s invitation');

-- Invitee: own invitation and the inviter's profile, no direct accept
:as_invitee
select is((select count(*)::int from admin_invitations), 2, 'invitee sees their invitations (case-insensitive email)');
select is((select full_name from profiles where id = :'u_owner'), 'Olle Owner', 'invitee sees the inviter''s profile');
update admin_invitations set accepted = true where id = :'inv_w2';
reset role;
select ok(not (select accepted from admin_invitations where id = :'inv_w2'), 'invitee cannot accept by direct update');

-- Owner: own invitations, the admin's profile, no admin rows for non-self-managed lists
:as_owner
select is((select count(*)::int from admin_invitations), 2, 'owner sees invitations for their lists');
select is((select email from profiles where id = :'u_admin'), 'admin@test.se', 'owner sees the admin''s profile');
update admin_invitations set email = 'stranger@test.se', accepted = true where id = :'inv_w2';
select is((select count(*)::int from profiles where id = :'u_stranger'), 0, 'owner cannot see a stranger''s profile');
select throws_ok(
  $$ insert into wishlist_admins (wishlist_id, admin_id, invited_by) values ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001') $$,
  '42501', null, 'owner cannot make themselves admin of a normal list');
reset role;
select is((select accepted::text || ',' || email from admin_invitations where id = :'inv_w2'), 'false,Invitee@test.se', 'owner cannot update an invitation');
select is((select count(*)::int from wishlist_admins where wishlist_id = :'w2'), 0, 'owner cannot make a stranger admin via invitation update');

-- Admin: sees the owner's profile
:as_admin
select is((select full_name from profiles where id = :'u_owner'), 'Olle Owner', 'admin sees the owner''s profile');
reset role;

select * from finish();
rollback;
