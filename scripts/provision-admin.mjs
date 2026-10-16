import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2]?.trim().toLowerCase();

if (!raw || !supabaseUrl || !serviceRoleKey || !email) {
  console.error(
    'Usage: FIREBASE_SERVICE_ACCOUNT_JSON=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ' +
      'node scripts/provision-admin.mjs admin@example.com',
  );
  process.exit(1);
}

// Admin identity stays in Firebase Auth; the admin registry now lives in Supabase.
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(raw)) });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
if (!user.emailVerified) {
  console.error('Admin accounts must have a verified email address.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await supabase
  .from('admins')
  .upsert({ id: user.uid, email: user.email, active: true }, { onConflict: 'id' });
if (error) {
  console.error('Unable to provision admin access in Supabase:', error.code ?? 'unknown error');
  process.exit(1);
}

console.log('Verified admin access provisioned.');
