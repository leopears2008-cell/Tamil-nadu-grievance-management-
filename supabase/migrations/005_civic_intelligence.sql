-- NivaranAI civic intelligence + public transparency indexes.
-- Safe to apply after 004_authority_workflow.sql.
create index if not exists idx_grievances_public_district on public.grievances(location_district);
create index if not exists idx_grievances_public_status_target on public.grievances(status,target_resolution_date);
create index if not exists idx_grievances_public_geo on public.grievances(location_lat,location_lng);
create index if not exists idx_grievance_escalations_created on public.grievance_escalations(created_at desc);
