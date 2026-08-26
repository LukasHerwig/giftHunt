#!/usr/bin/env node
/**
 * Supabase keep-alive: runs one full CRUD cycle against a dummy wishlist so the
 * project registers activity and does not get paused for inactivity.
 *
 * Local:  npm run keepalive          (reads credentials from .env.prod)
 * CI:     .github/workflows/keepalive.yml (reads them from GitHub Secrets)
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_WISHLIST_ID = '9634b226-93d0-46c2-9dfd-0e428f2b22a7';
const TITLE_PREFIX = 'keepalive ';

/** Load .env.prod into process.env without overriding values already set (CI wins). */
function loadEnvFile(path) {
  let contents;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    return; // Absent in CI, where the values come from secrets instead.
  }

  for (const line of contents.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
}

function requireEnv(...names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  console.error(`Missing required env var: ${names.join(' or ')}`);
  process.exit(1);
}

function step(label, detail) {
  console.log(`  ${label}${detail ? ` — ${detail}` : ''}`);
}

/** Unwrap a Supabase response, exiting with context if the step failed. */
function unwrap(label, { data, error }) {
  if (error) {
    console.error(`\n✗ ${label} failed: ${error.message}`);
    process.exit(1);
  }
  return data;
}

loadEnvFile(new URL('../.env.prod', import.meta.url).pathname);

const supabaseUrl = requireEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY');
const email = requireEnv('KEEPALIVE_EMAIL');
const password = requireEnv('KEEPALIVE_PASSWORD');
const wishlistId = process.env.KEEPALIVE_WISHLIST_ID || DEFAULT_WISHLIST_ID;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`Keep-alive against ${supabaseUrl}`);
console.log(`Wishlist ${wishlistId}\n`);

// 1. Auth — exercises GoTrue, not just Postgres.
const session = unwrap(
  'Sign in',
  await supabase.auth.signInWithPassword({ email, password })
);
step('signed in', session.user.email);

// Sweep rows left behind by an earlier run that died mid-cycle, so the dummy
// wishlist never accumulates junk.
const stale = unwrap(
  'Stale sweep',
  await supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlistId)
    .like('title', `${TITLE_PREFIX}%`)
    .select('id')
);
if (stale.length > 0) step('swept', `${stale.length} stale row(s) from a previous run`);

const timestamp = new Date().toISOString();

// 2. Create
const created = unwrap(
  'Create',
  await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: wishlistId,
      title: `${TITLE_PREFIX}${timestamp}`,
      description: 'Automated activity ping.',
    })
    .select()
    .single()
);
step('created', created.id);

// 3. Read
const read = unwrap(
  'Read',
  await supabase.from('wishlist_items').select('id, title, description').eq('id', created.id).single()
);
step('read', read.title);

// 4. Update
const updated = unwrap(
  'Update',
  await supabase
    .from('wishlist_items')
    .update({ description: `Automated activity ping, updated ${new Date().toISOString()}.` })
    .eq('id', created.id)
    .select('id, description')
    .single()
);
step('updated', updated.description);

// 5. Delete
const deleted = unwrap(
  'Delete',
  await supabase.from('wishlist_items').delete().eq('id', created.id).select('id')
);
if (deleted.length !== 1) {
  console.error(`\n✗ Delete removed ${deleted.length} rows, expected 1. Row ${created.id} may still exist.`);
  process.exit(1);
}
step('deleted', created.id);

await supabase.auth.signOut();
console.log('\n✓ Keep-alive complete — wishlist left unchanged.');
