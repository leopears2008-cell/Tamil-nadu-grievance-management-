-- Production hardening: private object-storage metadata for grievance evidence.
alter table public.grievance_attachments add column if not exists storage_path text;
alter table public.grievance_attachments add column if not exists mime_type text;
alter table public.grievance_attachments add column if not exists size_bytes integer;
alter table public.grievance_attachments add column if not exists malware_scan_status text not null default 'legacy';
create index if not exists idx_attachments_storage_path on public.grievance_attachments(storage_path);

-- Keep the evidence bucket private. Create it once in Supabase Storage with the
-- dashboard/API if it does not exist: GRIEVANCE_STORAGE_BUCKET (default: grievance-evidence).
-- Service-role uploads/downloads are performed only by the Express backend.
