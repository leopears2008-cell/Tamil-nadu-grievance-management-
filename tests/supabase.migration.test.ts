import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();

test('initial Supabase migration contains required tables and security', async () => {
  const sql = await readFile(join(root, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
  const normalized = sql.toLowerCase();

  for (const table of [
    'admins',
    'departments',
    'officers',
    'grievances',
    'grievance_status_history',
    'grievance_attachments',
    'audit_logs',
  ]) {
    assert.ok(normalized.includes('create table if not exists public.' + table));
  }

  assert.match(normalized, /enable row level security/);
  assert.match(normalized, /create policy grievances_select/);
  assert.match(normalized, /create policy grievances_insert_own/);
  assert.doesNotMatch(normalized, /grievances_department_id_fkey/);
});

test('application source has no Firestore client database imports', async () => {
  const firebaseClient = await readFile(join(root, 'src/lib/firebase.ts'), 'utf8');
  assert.doesNotMatch(firebaseClient, /firebase\/firestore|firebase-admin\/firestore|getFirestore|collection\(/);
});

test('Supabase service client is server-only', async () => {
  const serverClient = await readFile(join(root, 'server/supabase.ts'), 'utf8');
  assert.match(serverClient, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(serverClient, /createClient/);
});


test('civic intelligence migration adds public analytics indexes', async () => {
  const sql = await readFile(join(root, 'supabase/migrations/005_civic_intelligence.sql'), 'utf8');
  const normalized = sql.toLowerCase();
  assert.match(normalized, /idx_grievances_public_district/);
  assert.match(normalized, /idx_grievances_public_status_target/);
  assert.match(normalized, /idx_grievances_public_geo/);
});
