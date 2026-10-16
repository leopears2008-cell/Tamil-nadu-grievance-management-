-- NivaranAI: initial Supabase (PostgreSQL) schema, migrated from Firestore.
-- Safe to re-run: tables/indexes use IF NOT EXISTS, functions use CREATE OR REPLACE,
-- triggers and policies are dropped and recreated.
--
-- Identity model: users keep signing in with Firebase Auth. Supabase is configured
-- with Firebase as a third-party auth provider, so auth.jwt() ->> 'sub' is the
-- Firebase UID. See docs/SUPABASE_MIGRATION.md.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.requesting_uid()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif((select auth.jwt() ->> 'sub'), '');
$$;

-- Mirrors firestore.rules isAdmin(): verified email + active record in admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.id = (select auth.jwt() ->> 'sub')
      and a.active
      and coalesce((select auth.jwt() ->> 'email_verified'), 'false') = 'true'
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Firestore: admins/{firebaseUid}
create table if not exists public.admins (
  id text primary key,                       -- Firebase UID
  email text,
  active boolean not null default true,
  provisioned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Firestore: departments/{id}
create table if not exists public.departments (
  id text primary key,                       -- e.g. dept-water
  name text not null,
  name_tamil text not null default '',
  code text not null default '',
  head_name text not null default '',
  contact_number text not null default '',
  email text not null default '',
  total_grievances integer not null default 0,
  pending_count integer not null default 0,
  resolved_count integer not null default 0,
  sla_days integer not null default 0,
  icon_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Firestore: officers/{id}
create table if not exists public.officers (
  id text primary key,
  name text not null,
  name_tamil text,
  department_id text not null references public.departments (id) on update cascade,
  department_name text not null default '',
  designation text not null default '',
  phone text not null default '',
  email text not null default '',
  active_count integer not null default 0,
  resolved_count integer not null default 0,
  avatar text not null default '',
  zone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Firestore: grievances/{trackId}. The Firestore document ID equals trackId
-- (GRV-YYYY-XXXXXXXX), so it is kept as the text primary key to preserve IDs.
-- The location map is flattened into columns. statusHistory and attachments
-- arrays live in child tables below.
create table if not exists public.grievances (
  id text primary key,
  track_id text not null unique,
  citizen_id text,                           -- Firebase UID (not a FK: Firebase owns users)
  verification_method text check (verification_method in ('phone', 'email')),
  citizen_name text not null,
  citizen_phone text not null default '',
  citizen_email text,
  language text not null check (language in ('Tamil', 'English', 'Tanglish', 'Other')),
  original_transcript text not null default '',
  summary_en text not null default '',
  summary_ta text not null default '',
  category text not null check (category in (
    'Street Light', 'Water Supply', 'Roads & Potholes', 'Sanitation & Drainage',
    'Electricity & Power', 'Public Health & Fogging', 'Transport & Traffic',
    'Encroachment & Parks', 'Other'
  )),
  department_id text,
  department_name text not null default '',
  priority text not null check (priority in ('Critical', 'High', 'Medium', 'Low')),
  priority_reason text not null default '',
  confidence_score numeric(4, 3) not null default 0 check (confidence_score >= 0 and confidence_score <= 1),

  location_address text not null default '',
  location_landmark text,
  location_district text not null default '',
  location_constituency text,
  location_ward_number text,
  location_pincode text,
  location_lat double precision check (location_lat is null or (location_lat between -90 and 90)),
  location_lng double precision check (location_lng is null or (location_lng between -180 and 180)),

  status text not null default 'Submitted' check (status in (
    'Submitted', 'AI Classified', 'Assigned', 'Under Review',
    'In Progress', 'Resolved', 'Reopened', 'Rejected'
  )),
  assigned_officer_id text references public.officers (id) on update cascade on delete set null,
  assigned_officer_name text,
  assigned_officer_phone text,
  assigned_at timestamptz,
  target_resolution_date timestamptz,
  estimated_days integer check (estimated_days is null or (estimated_days between 0 and 365)),
  resolved_at timestamptz,
  resolution_remarks text,
  resolution_evidence_url text,

  feedback_rating smallint check (feedback_rating is null or (feedback_rating between 1 and 5)),
  feedback_comment text,
  feedback_satisfied boolean,
  feedback_submitted_at timestamptz,

  entities jsonb not null default '{}'::jsonb,   -- duration, affectedCount, equipment, urgencyMarkers
  is_duplicate_of text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Firestore: grievances.statusHistory[] (array of maps)
create table if not exists public.grievance_status_history (
  id bigint generated always as identity primary key,
  grievance_id text not null references public.grievances (id) on update cascade on delete cascade,
  status text not null check (status in (
    'Submitted', 'AI Classified', 'Assigned', 'Under Review',
    'In Progress', 'Resolved', 'Reopened', 'Rejected'
  )),
  occurred_at timestamptz not null default now(),   -- Firestore field: timestamp
  updated_by text not null default '',
  role text not null check (role in ('CITIZEN', 'OFFICER', 'ADMIN')),
  remarks text not null default '',
  evidence_url text,
  created_at timestamptz not null default now()
);

-- Firestore: grievances.attachments[] (array of maps)
create table if not exists public.grievance_attachments (
  id uuid primary key default gen_random_uuid(),
  grievance_id text not null references public.grievances (id) on update cascade on delete cascade,
  attachment_id text not null,                       -- Firestore field: id
  url text not null check (char_length(url) <= 550000),
  name text not null default '',
  type text not null check (type in ('image', 'audio', 'document')),
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (grievance_id, attachment_id)
);

-- Firestore: auditLogs/{id}
create table if not exists public.audit_logs (
  id text primary key,
  occurred_at timestamptz not null default now(),    -- Firestore field: timestamp
  user_id text not null,
  user_name text not null default '',
  user_role text not null check (user_role in ('CITIZEN', 'OFFICER', 'ADMIN')),
  action text not null,
  details text not null default '',
  grievance_id text references public.grievances (id) on update cascade on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_grievances_citizen_id on public.grievances (citizen_id);
create index if not exists idx_grievances_status on public.grievances (status);
create index if not exists idx_grievances_category on public.grievances (category);
create index if not exists idx_grievances_priority on public.grievances (priority);
create index if not exists idx_grievances_department_id on public.grievances (department_id);
create index if not exists idx_grievances_assigned_officer_id on public.grievances (assigned_officer_id);
create index if not exists idx_grievances_created_at on public.grievances (created_at desc);
create index if not exists idx_grievances_district on public.grievances (lower(location_district));
create index if not exists idx_officers_department_id on public.officers (department_id);
create index if not exists idx_status_history_grievance on public.grievance_status_history (grievance_id, occurred_at);
create index if not exists idx_attachments_grievance on public.grievance_attachments (grievance_id);
create index if not exists idx_audit_logs_occurred_at on public.audit_logs (occurred_at desc);
create index if not exists idx_audit_logs_grievance on public.audit_logs (grievance_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists trg_admins_updated_at on public.admins;
create trigger trg_admins_updated_at before update on public.admins
  for each row execute function public.set_updated_at();

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_officers_updated_at on public.officers;
create trigger trg_officers_updated_at before update on public.officers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_grievances_updated_at on public.grievances;
create trigger trg_grievances_updated_at before update on public.grievances
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Column-level write guard for grievances (RLS cannot restrict columns).
-- Mirrors the affectedKeys().hasOnly(...) checks in firestore.rules.
-- Only applies to end-user roles; service_role / postgres are unrestricted.
-- ---------------------------------------------------------------------------
create or replace function public.grievances_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  admin_cols constant text[] := array[
    'status', 'updated_at', 'assigned_officer_id', 'assigned_officer_name',
    'assigned_officer_phone', 'assigned_at', 'target_resolution_date',
    'resolved_at', 'resolution_remarks', 'resolution_evidence_url'
  ];
  citizen_cols constant text[] := array[
    'feedback_rating', 'feedback_comment', 'feedback_satisfied',
    'feedback_submitted_at', 'updated_at'
  ];
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.is_admin() then
    if (to_jsonb(new) - admin_cols) is distinct from (to_jsonb(old) - admin_cols) then
      raise exception 'Administrators may only change workflow fields on a grievance.'
        using errcode = '42501';
    end if;
  else
    if (to_jsonb(new) - citizen_cols) is distinct from (to_jsonb(old) - citizen_cols) then
      raise exception 'Citizens may only submit feedback on their own grievance.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_grievances_guard_update on public.grievances;
create trigger trg_grievances_guard_update before update on public.grievances
  for each row execute function public.grievances_guard_update();

-- ---------------------------------------------------------------------------
-- Privileges + Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.departments enable row level security;
alter table public.officers enable row level security;
alter table public.grievances enable row level security;
alter table public.grievance_status_history enable row level security;
alter table public.grievance_attachments enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table
  public.admins, public.departments, public.officers, public.grievances,
  public.grievance_status_history, public.grievance_attachments, public.audit_logs
  from anon, authenticated;

grant select on public.admins to authenticated;
grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.officers to authenticated;
grant select, insert, update on public.grievances to authenticated;
grant select, insert on public.grievance_status_history to authenticated;
grant select, insert on public.grievance_attachments to authenticated;
grant select, insert on public.audit_logs to authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
revoke all on function public.requesting_uid() from public, anon;
grant execute on function public.requesting_uid() to authenticated, service_role;

-- admins: a user may read only their own record; writes are service-role only.
drop policy if exists admins_select_own on public.admins;
create policy admins_select_own on public.admins
  for select to authenticated
  using (id = (select public.requesting_uid()));

-- departments / officers: administrators only.
drop policy if exists departments_admin_all on public.departments;
create policy departments_admin_all on public.departments
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists officers_admin_all on public.officers;
create policy officers_admin_all on public.officers
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- grievances
drop policy if exists grievances_select on public.grievances;
create policy grievances_select on public.grievances
  for select to authenticated
  using (
    (select public.is_admin())
    or citizen_id = (select public.requesting_uid())
  );

drop policy if exists grievances_insert_own on public.grievances;
create policy grievances_insert_own on public.grievances
  for insert to authenticated
  with check (
    citizen_id = (select public.requesting_uid())
    and status = 'Submitted'
    and id = track_id
    and id ~ '^GRV-[0-9]{4}-[A-F0-9]{8}$'
    and (
      (verification_method = 'phone'
        and citizen_phone = coalesce((select auth.jwt() ->> 'phone_number'), ''))
      or
      (verification_method = 'email'
        and coalesce((select auth.jwt() ->> 'email_verified'), 'false') = 'true'
        and citizen_email = coalesce((select auth.jwt() ->> 'email'), ''))
    )
  );

-- Column restrictions are enforced by trg_grievances_guard_update.
drop policy if exists grievances_update on public.grievances;
create policy grievances_update on public.grievances
  for update to authenticated
  using (
    (select public.is_admin())
    or citizen_id = (select public.requesting_uid())
  )
  with check (
    (select public.is_admin())
    or citizen_id = (select public.requesting_uid())
  );
-- No DELETE policy: grievances cannot be deleted by end users.

-- status history: visible wherever the parent grievance is visible.
drop policy if exists status_history_select on public.grievance_status_history;
create policy status_history_select on public.grievance_status_history
  for select to authenticated
  using (exists (select 1 from public.grievances g where g.id = grievance_id));

drop policy if exists status_history_insert_admin on public.grievance_status_history;
create policy status_history_insert_admin on public.grievance_status_history
  for insert to authenticated
  with check ((select public.is_admin()));

-- A citizen may write only the single initial 'Submitted' entry on their own grievance.
drop policy if exists status_history_insert_citizen on public.grievance_status_history;
create policy status_history_insert_citizen on public.grievance_status_history
  for insert to authenticated
  with check (
    status = 'Submitted'
    and role = 'CITIZEN'
    and updated_by = 'Citizen'
    and exists (
      select 1 from public.grievances g
      where g.id = grievance_id and g.citizen_id = (select public.requesting_uid())
    )
    and not exists (
      select 1 from public.grievance_status_history h
      where h.grievance_id = grievance_status_history.grievance_id
    )
  );

-- attachments: citizen may add one image to their own grievance.
drop policy if exists attachments_select on public.grievance_attachments;
create policy attachments_select on public.grievance_attachments
  for select to authenticated
  using (exists (select 1 from public.grievances g where g.id = grievance_id));

drop policy if exists attachments_insert_citizen on public.grievance_attachments;
create policy attachments_insert_citizen on public.grievance_attachments
  for insert to authenticated
  with check (
    type = 'image'
    and url ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]*={0,2}$'
    and exists (
      select 1 from public.grievances g
      where g.id = grievance_id and g.citizen_id = (select public.requesting_uid())
    )
    and not exists (
      select 1 from public.grievance_attachments a
      where a.grievance_id = grievance_attachments.grievance_id
    )
  );

-- audit logs: administrators read and append; never update or delete.
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists audit_logs_insert_admin on public.audit_logs;
create policy audit_logs_insert_admin on public.audit_logs
  for insert to authenticated
  with check (
    (select public.is_admin())
    and user_id = (select public.requesting_uid())
    and user_role = 'ADMIN'
  );
