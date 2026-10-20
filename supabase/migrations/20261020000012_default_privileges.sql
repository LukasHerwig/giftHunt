-- Supabase's default privileges grant every new public table and sequence to anon.
-- Anonymous access in this app goes only through token RPCs, so stop that for
-- objects created by postgres (which runs the migrations).
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
