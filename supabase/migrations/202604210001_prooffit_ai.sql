create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'job_seeker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  delete_raw_uploads boolean not null default true,
  save_structured_resume boolean not null default false,
  allow_product_analytics boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text,
  file_type text,
  extracted_text text,
  structured_resume jsonb not null,
  source_hash text,
  storage_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  raw_text text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tailoring_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_description_id uuid not null references public.job_descriptions(id) on delete cascade,
  status text not null default 'draft',
  ats_safe_mode boolean not null default true,
  primary_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tailoring_suggestions (
  id uuid primary key default gen_random_uuid(),
  tailoring_session_id uuid not null references public.tailoring_sessions(id) on delete cascade,
  original_bullet text not null,
  suggested_bullet text not null,
  rewrite_reason text not null,
  confidence_score numeric(4, 3) not null,
  supported_by_resume boolean not null default true,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.suggestion_evidence_links (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.tailoring_suggestions(id) on delete cascade,
  source_resume_snippet text not null,
  matched_jd_snippet text not null,
  evidence_type text not null default 'resume_to_jd',
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  tailoring_session_id uuid not null references public.tailoring_sessions(id) on delete cascade,
  terminology_coverage_score integer not null,
  evidence_coverage_score integer not null,
  ats_formatting_risk_score integer not null,
  readability_score integer not null,
  domain_fit_score integer not null,
  seniority_alignment_score integer not null,
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  tailoring_session_id uuid not null references public.tailoring_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  accepted_suggestion_ids uuid[] not null default '{}',
  final_resume jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  format text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free',
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes(user_id);
create index if not exists job_descriptions_user_id_idx on public.job_descriptions(user_id);
create index if not exists tailoring_sessions_user_id_idx on public.tailoring_sessions(user_id);
create index if not exists tailoring_suggestions_session_id_idx on public.tailoring_suggestions(tailoring_session_id);
create index if not exists scores_session_id_idx on public.scores(tailoring_session_id);
create index if not exists resume_versions_user_id_idx on public.resume_versions(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);

alter table public.users enable row level security;
alter table public.privacy_preferences enable row level security;
alter table public.resumes enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.tailoring_sessions enable row level security;
alter table public.tailoring_suggestions enable row level security;
alter table public.suggestion_evidence_links enable row level security;
alter table public.scores enable row level security;
alter table public.resume_versions enable row level security;
alter table public.exports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

create policy "users manage own profile" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users manage own privacy preferences" on public.privacy_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own resumes" on public.resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own job descriptions" on public.job_descriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own tailoring sessions" on public.tailoring_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own suggestions" on public.tailoring_suggestions
  for all using (
    exists (
      select 1
      from public.tailoring_sessions
      where public.tailoring_sessions.id = tailoring_session_id
        and public.tailoring_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tailoring_sessions
      where public.tailoring_sessions.id = tailoring_session_id
        and public.tailoring_sessions.user_id = auth.uid()
    )
  );

create policy "users read own evidence links" on public.suggestion_evidence_links
  for all using (
    exists (
      select 1
      from public.tailoring_suggestions
      join public.tailoring_sessions on public.tailoring_sessions.id = public.tailoring_suggestions.tailoring_session_id
      where public.tailoring_suggestions.id = suggestion_id
        and public.tailoring_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tailoring_suggestions
      join public.tailoring_sessions on public.tailoring_sessions.id = public.tailoring_suggestions.tailoring_session_id
      where public.tailoring_suggestions.id = suggestion_id
        and public.tailoring_sessions.user_id = auth.uid()
    )
  );

create policy "users read own scores" on public.scores
  for all using (
    exists (
      select 1
      from public.tailoring_sessions
      where public.tailoring_sessions.id = tailoring_session_id
        and public.tailoring_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tailoring_sessions
      where public.tailoring_sessions.id = tailoring_session_id
        and public.tailoring_sessions.user_id = auth.uid()
    )
  );

create policy "users manage own resume versions" on public.resume_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own exports" on public.exports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own audit logs" on public.audit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
