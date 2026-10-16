const required = ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'ADMIN_EMAILS', 'CORS_ORIGINS', 'GEMINI_API_KEY', 'PUBLIC_API_URL'];
const missing = required.filter((key) => !process.env[key]);
const production = process.env.NODE_ENV === 'production';

if (production && missing.length) {
  console.error(JSON.stringify({ ok: false, missing }));
  process.exit(1);
}

if (production) {
  const hardening = {
    distributedRateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    malwareScanning: Boolean(process.env.CLAMAV_SCAN_URL),
    privateEvidenceBucket: Boolean(process.env.GRIEVANCE_STORAGE_BUCKET),
    licensedNews: process.env.NEWS_PROVIDER === 'newsapi' && Boolean(process.env.NEWS_API_KEY),
    centralizedAlerts: Boolean(process.env.OBSERVABILITY_WEBHOOK_URL),
  };
  const failed = Object.entries(hardening).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) {
    console.error(JSON.stringify({ ok: false, hardeningFailures: failed }));
    process.exit(1);
  }
}

console.log(JSON.stringify({ ok: true, production }));
