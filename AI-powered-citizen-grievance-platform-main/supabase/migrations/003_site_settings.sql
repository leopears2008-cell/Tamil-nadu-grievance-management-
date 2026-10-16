-- NivaranAI public website configuration
-- Settings are server-managed so the browser never receives Supabase service credentials.
create table if not exists public.site_settings (
  id text primary key,
  site_title text not null default 'NivaranAI Grievance Portal',
  site_subtitle text not null default 'AI-assisted civic grievance management',
  announcement text not null default '',
  chatbot_enabled boolean not null default true,
  show_hero boolean not null default true,
  show_ai_demo boolean not null default true,
  show_map boolean not null default true,
  show_faq boolean not null default true,
  show_directory boolean not null default true,
  show_ministers boolean not null default true,
  show_news boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant all on table public.site_settings to service_role;

insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;
