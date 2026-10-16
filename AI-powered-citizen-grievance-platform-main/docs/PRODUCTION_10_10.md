# Production 10/10 Deployment Contract

The application now fails closed for critical production-hardening controls instead of silently falling back.

## Required production variables

- NODE_ENV=production
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- FIREBASE_SERVICE_ACCOUNT_JSON
- ADMIN_EMAILS
- CORS_ORIGINS
- GEMINI_API_KEY
- PUBLIC_API_URL
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- CLAMAV_SCAN_URL
- GRIEVANCE_STORAGE_BUCKET=grievance-evidence
- OBSERVABILITY_WEBHOOK_URL
- NEWS_PROVIDER=newsapi
- NEWS_API_KEY

Run: npm run validate:production

## Distributed rate limiting
With Upstash credentials configured, request counters are stored in Redis rather than process memory. The API exposes X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset.

## Evidence security
Citizen image evidence is validated by MIME/signature, size checked, malware-scanned, and stored in a private Supabase Storage bucket. The API serves evidence through an authenticated proxy rather than exposing a public object URL.

## Centralized monitoring
HTTP 5xx responses produce structured JSON logs and can send alert payloads to OBSERVABILITY_WEBHOOK_URL. The existing admin observability endpoint remains available for operational metrics.

## News
NEWS_PROVIDER=newsapi enables the production licensed-news adapter. google-rss remains available for development/transition environments.

## AI/RAG evaluation
The repository includes classification, prompt-injection, hallucination, retrieval precision/recall/F1, and golden RAG cases. Production changes should not ship if these regression checks fail.

## Readiness
- GET /healthz = liveness
- GET /readyz = dependency/configuration readiness
- /readyz returns HTTP 503 when required production dependencies are not ready.

## Final deployment sequence
1. Apply Supabase migrations.
2. Configure the private evidence bucket settings.
3. Configure Upstash Redis.
4. Deploy the malware scanning service and set CLAMAV_SCAN_URL.
5. Configure the licensed news provider and key.
6. Configure the centralized alert webhook.
7. Set all production variables.
8. Run npm run validate:production.
9. Run CI.
10. Deploy backend.
11. Confirm /healthz and /readyz.
12. Test citizen complaint -> AI -> database -> admin -> assignment -> resolution evidence -> citizen verification.
