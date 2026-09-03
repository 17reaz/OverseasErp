-- =========================================================
-- EXPORT / IMPORT JOB TABLES
-- ---------------------------------------------------------
-- Tenant-isolated job tracking for the Data Management
-- (Export / Import / Backup) feature.
--
-- Tenant resolution pattern mirrors the rest of the app:
-- profiles.id = auth.uid()  ->  profiles.tenant_id
-- =========================================================

-- ---------------------------------------------------------
-- EXPORT_JOBS
-- ---------------------------------------------------------

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,

  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),

  export_type text not null
    check (export_type in (
      'all', 'candidates', 'agents', 'agencies',
      'medical', 'mofa', 'visa', 'flight'
    )),

  format text not null default 'xlsx'
    check (format in ('xlsx')),

  file_path text,
  file_name text,
  file_size bigint,
  record_count integer,

  error_message text,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists export_jobs_tenant_id_idx
  on public.export_jobs (tenant_id);

create index if not exists export_jobs_tenant_created_idx
  on public.export_jobs (tenant_id, created_at desc);

create index if not exists export_jobs_status_idx
  on public.export_jobs (status);

alter table public.export_jobs enable row level security;

-- Tenant members can view their own tenant's export jobs.
create policy export_jobs_select_own_tenant
  on public.export_jobs
  for select
  to authenticated
  using (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

-- No direct insert/update/delete from the client.
-- All writes happen via the `data-export` Edge Function using
-- the service_role key, which bypasses RLS by design.


-- ---------------------------------------------------------
-- IMPORT_JOBS
-- ---------------------------------------------------------

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,

  status text not null default 'uploaded'
    check (status in (
      'uploaded', 'parsing', 'validating', 'ready',
      'committing', 'completed', 'failed', 'cancelled'
    )),

  file_path text not null,
  file_name text not null,
  file_size bigint,

  import_type text not null
    check (import_type in (
      'candidates', 'agents', 'agencies',
      'medical', 'mofa', 'visa', 'flight'
    )),

  conflict_strategy text not null default 'skip'
    check (conflict_strategy in ('skip', 'update', 'error')),

  total_rows integer default 0,
  valid_rows integer default 0,
  invalid_rows integer default 0,
  inserted_rows integer default 0,
  updated_rows integer default 0,
  skipped_rows integer default 0,
  error_count integer default 0,

  -- Structured validation errors + normalized parsed rows,
  -- so the commit step never has to re-parse the workbook.
  -- shape: { errors: [...], rows: [...] }
  validation_result jsonb,

  created_at timestamptz not null default now(),
  completed_at timestamptz,
  committed_at timestamptz,

  error_message text
);

create index if not exists import_jobs_tenant_id_idx
  on public.import_jobs (tenant_id);

create index if not exists import_jobs_tenant_created_idx
  on public.import_jobs (tenant_id, created_at desc);

create index if not exists import_jobs_status_idx
  on public.import_jobs (status);

alter table public.import_jobs enable row level security;

create policy import_jobs_select_own_tenant
  on public.import_jobs
  for select
  to authenticated
  using (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

-- Same as export_jobs: writes only via Edge Functions
-- (data-import / data-import-commit) using service_role.
