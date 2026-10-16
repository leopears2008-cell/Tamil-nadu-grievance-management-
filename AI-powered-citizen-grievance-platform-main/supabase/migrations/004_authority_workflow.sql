-- NivaranAI: authority workflow + resolution verification + escalation.
-- Safe to apply after 001_initial_schema.sql and 003_site_settings.sql.

alter table public.officers
  add column if not exists auth_uid text unique,
  add column if not exists active boolean not null default true;

alter table public.grievances
  add column if not exists resolution_verified_at timestamptz,
  add column if not exists resolution_verified_by text,
  add column if not exists escalation_reason text,
  add column if not exists escalated_at timestamptz,
  add column if not exists escalated_to_department_id text references public.departments(id) on update cascade on delete set null;

create table if not exists public.grievance_escalations (
  id uuid primary key default gen_random_uuid(),
  grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
  from_department_id text,
  to_department_id text not null references public.departments(id) on update cascade on delete restrict,
  reason text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_officers_auth_uid on public.officers(auth_uid);
create index if not exists idx_officers_active_department on public.officers(active, department_id);
create index if not exists idx_grievances_escalated_at on public.grievances(escalated_at);
create index if not exists idx_grievance_escalations_grievance on public.grievance_escalations(grievance_id, created_at desc);

alter table public.grievance_escalations enable row level security;
revoke all on table public.grievance_escalations from anon, authenticated;
grant select, insert on public.grievance_escalations to authenticated;

drop policy if exists grievance_escalations_authorized_read on public.grievance_escalations;
create policy grievance_escalations_authorized_read on public.grievance_escalations
for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.officers o
  where o.auth_uid = public.requesting_uid()
    and o.active
    and o.department_id = grievance_escalations.to_department_id
));

drop policy if exists grievance_escalations_authorized_insert on public.grievance_escalations;
create policy grievance_escalations_authorized_insert on public.grievance_escalations
for insert to authenticated
with check (public.is_admin() or exists (
  select 1 from public.officers o
  where o.auth_uid = public.requesting_uid()
    and o.active
    and o.department_id = grievance_escalations.from_department_id
));

-- Officers can read only their assigned grievances when using the Supabase client.
drop policy if exists grievances_officer_select_assigned on public.grievances;
create policy grievances_officer_select_assigned on public.grievances
for select to authenticated
using (
  public.is_admin()
  or citizen_id = public.requesting_uid()
  or exists (
    select 1 from public.officers o
    where o.auth_uid = public.requesting_uid()
      and o.active
      and o.id = grievances.assigned_officer_id
  )
);

-- Officer updates are limited to operational workflow fields. The application server
-- performs the same ownership checks before writing with its service role.
create or replace function public.grievances_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  admin_cols constant text[] := array[
    'status', 'updated_at', 'assigned_officer_id', 'assigned_officer_name',
    'assigned_officer_phone', 'assigned_at', 'target_resolution_date',
    'resolved_at', 'resolution_remarks', 'resolution_evidence_url',
    'escalation_reason', 'escalated_at', 'escalated_to_department_id',
    'resolution_verified_at', 'resolution_verified_by'
  ];
  citizen_cols constant text[] := array[
    'feedback_rating', 'feedback_comment', 'feedback_satisfied',
    'feedback_submitted_at', 'updated_at', 'resolution_verified_at', 'resolution_verified_by'
  ];
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.is_admin() then
    if (to_jsonb(new) - admin_cols) is distinct from (to_jsonb(old) - admin_cols) then
      raise exception 'Administrators may only change workflow fields on a grievance.' using errcode = '42501';
    end if;
  else
    if (to_jsonb(new) - citizen_cols) is distinct from (to_jsonb(old) - citizen_cols) then
      raise exception 'Citizens may only submit feedback or resolution verification on their own grievance.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;


-- Enforce the authority workflow column guard for authenticated/anon Supabase sessions.
drop trigger if exists trg_grievances_guard_update on public.grievances;
create trigger trg_grievances_guard_update
before update on public.grievances
for each row execute function public.grievances_guard_update();

-- Audit records are append-only. Application code never updates or deletes them.
create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit logs are immutable.' using errcode = '42501';
end;
$$;

drop trigger if exists trg_audit_logs_immutable on public.audit_logs;
create trigger trg_audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();
