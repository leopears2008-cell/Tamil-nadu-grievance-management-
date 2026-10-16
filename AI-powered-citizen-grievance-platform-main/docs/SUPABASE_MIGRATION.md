# Firebase Firestore -> Supabase PostgreSQL

## Migration status

The application database is now Supabase PostgreSQL. Firebase Authentication remains in use for identity and ID-token verification.

The production data path is:

**Vercel React/Vite frontend -> Express API -> Supabase PostgreSQL**

The browser does not use a Supabase service-role key and does not initialize Firestore.

## Firebase -> Supabase mapping

| Firebase/Firestore | Supabase/PostgreSQL |
| --- | --- |
| `grievances/{trackId}` | `grievances` |
| `grievances.statusHistory[]` | `grievance_status_history` |
| `grievances.attachments[]` | `grievance_attachments` |
| `departments/{id}` | `departments` |
| `officers/{id}` | `officers` |
| `admins/{uid}` | `admins` |
| `auditLogs/{id}` | `audit_logs` |
| `notifications` | Not created because the application does not persist or read notifications. |

Firestore document IDs are preserved where they are part of the application's identity model. Firestore timestamps are imported as PostgreSQL `timestamptz`. Nested grievance maps are flattened into relational columns, while `entities` remains `jsonb`.

## Database access

Application data is accessed through `server/grievanceRoutes.ts` using the official `@supabase/supabase-js` client.

`server/supabase.ts` creates exactly one server-side Supabase client and uses `SUPABASE_SERVICE_ROLE_KEY`. This key must never be exposed to Vite or committed to the repository.

Firebase Auth remains separate from the database. `src/lib/firebase.ts` initializes Auth only; it no longer imports or initializes Firestore.

## Schema

Primary migration:

`supabase/migrations/001_initial_schema.sql`

It includes tables, primary/foreign keys, indexes, timestamp triggers, constraints, and Row Level Security policies. The initial migration is self-contained; the obsolete follow-up migration that only removed the grievance department FK is no longer required.

## Existing-data import

`scripts/migrate-firestore-to-supabase.mjs` is intentionally retained as a trusted, one-way import utility. It reads Firestore but does not delete or modify source data.

Required server-side variables for import:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIRESTORE_DATABASE_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Run:

`node scripts/migrate-firestore-to-supabase.mjs --dry-run`

then, after validating counts:

`node scripts/migrate-firestore-to-supabase.mjs`

The application itself does not require Firestore credentials after the import. Do not run the import against production more than necessary.

## Environment variables

### Server

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` for Firebase Auth token verification
- `GEMINI_API_KEY`
- `ADMIN_EMAILS`
- `CORS_ORIGINS`

### Vercel/Vite frontend

- `VITE_API_URL`
- Firebase Auth public configuration:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not required by the current frontend because database access is server-mediated. If direct browser Supabase access is introduced later, use the anon key only and configure RLS/third-party Firebase authentication first.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_` variable.

## Verification

Run:

`npm install`

`npm run lint`

`npm test`

`npm run build`

The tests include static checks that the Firebase client no longer imports Firestore and that the initial Supabase migration contains the expected tables and RLS controls.
