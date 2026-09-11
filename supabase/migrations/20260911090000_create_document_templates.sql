-- =========================================================
-- DOCUMENT TEMPLATE SYSTEM
-- ---------------------------------------------------------
-- Adds the Document Templates feature inside the existing
-- Reports module: `document_templates` (the reusable
-- template definitions, e.g. "Saudi Employment Contract")
-- and `generated_documents` (a lightweight audit history of
-- documents produced from a template).
--
-- Tenant resolution pattern mirrors the rest of the app:
-- profiles.id = auth.uid()  ->  profiles.tenant_id
--
-- This migration does NOT touch any existing table's
-- behaviour. It only adds new tables and a small set of
-- additive, nullable columns to `candidates` (see bottom of
-- file) so dynamic fields like {{candidate.nationality}} can
-- resolve automatically once populated.
-- =========================================================

-- ---------------------------------------------------------
-- DOCUMENT_TEMPLATES
-- ---------------------------------------------------------

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,

  name text not null,

  category text not null default 'custom'
    check (category in (
      'employment', 'demand_letter', 'offer_letter',
      'guarantee_letter', 'salary_certificate', 'custom'
    )),

  description text,

  -- ContentBlock[] — static legal text + {{source.key}} tokens.
  content jsonb not null default '[]'::jsonb,

  -- TemplateSchema — the manual/contract fields this template
  -- needs at generation time (see template-types.ts).
  schema jsonb not null default '{"fields": []}'::jsonb,

  -- TemplateSettings — paper size, orientation, margins.
  settings jsonb not null default
    '{"paperSize":"A4","orientation":"portrait","margins":{"top":20,"right":20,"bottom":20,"left":20}}'::jsonb,

  status text not null default 'draft'
    check (status in ('draft', 'locked')),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_templates_tenant_id_idx
  on public.document_templates (tenant_id);

create index if not exists document_templates_tenant_active_idx
  on public.document_templates (tenant_id, is_active);

create index if not exists document_templates_category_idx
  on public.document_templates (category);

alter table public.document_templates enable row level security;

-- Every tenant member can view active/locked templates to use
-- them, and view drafts too (needed for the builder itself).
create policy document_templates_select_own_tenant
  on public.document_templates
  for select
  to authenticated
  using (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

-- Only OWNER/ADMIN profiles may create, edit, lock/unlock, or
-- remove templates. Everyone else can only SELECT (i.e. use
-- locked templates to generate documents).
--
-- NOTE: `profiles.role` is free text today (no dedicated
-- permission system exists in this project yet — see
-- template-permissions.ts). If the project's role values
-- differ from 'owner'/'admin', update the two `in (...)`
-- lists below to match.
create policy document_templates_insert_managers
  on public.document_templates
  for insert
  to authenticated
  with check (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
    and (
      select lower(role) from public.profiles where id = auth.uid()
    ) in ('owner', 'admin')
  );

create policy document_templates_update_managers
  on public.document_templates
  for update
  to authenticated
  using (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
    and (
      select lower(role) from public.profiles where id = auth.uid()
    ) in ('owner', 'admin')
  )
  with check (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

create policy document_templates_delete_managers
  on public.document_templates
  for delete
  to authenticated
  using (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
    and (
      select lower(role) from public.profiles where id = auth.uid()
    ) in ('owner', 'admin')
  );

-- Keep updated_at current on every UPDATE.
create or replace function public.set_document_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists document_templates_set_updated_at
  on public.document_templates;

create trigger document_templates_set_updated_at
  before update on public.document_templates
  for each row
  execute function public.set_document_templates_updated_at();

-- ---------------------------------------------------------
-- GENERATED_DOCUMENTS
-- ---------------------------------------------------------
-- Audit history of documents produced from a template. The
-- PDF itself is generated on the fly in the browser (mirrors
-- the existing Reports PDF flow) — this table stores the
-- resolved field values used, for traceability.

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,

  template_id uuid not null references public.document_templates(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,

  -- Flat snapshot of every resolved field value at
  -- generation time (candidate + company + contract fields).
  document_data jsonb not null default '{}'::jsonb,

  document_number text,

  created_at timestamptz not null default now()
);

create index if not exists generated_documents_tenant_id_idx
  on public.generated_documents (tenant_id);

create index if not exists generated_documents_template_id_idx
  on public.generated_documents (template_id);

create index if not exists generated_documents_candidate_id_idx
  on public.generated_documents (candidate_id);

alter table public.generated_documents enable row level security;

create policy generated_documents_select_own_tenant
  on public.generated_documents
  for select
  to authenticated
  using (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

-- Any active tenant member can generate documents from a
-- locked, active template (not just managers) — matches the
-- "MANAGER/STAFF can use active locked templates" requirement.
create policy generated_documents_insert_own_tenant
  on public.generated_documents
  for insert
  to authenticated
  with check (
    tenant_id = (
      select tenant_id from public.profiles where id = auth.uid()
    )
  );

-- No client-side UPDATE/DELETE — generated document history
-- is append-only, same pattern as export_jobs/import_jobs.

-- =========================================================
-- CANDIDATES — additive, nullable columns
-- ---------------------------------------------------------
-- The existing `candidates` table has no nationality,
-- profession, date_of_birth, address, or phone columns (this
-- was confirmed by inspecting candidate-service.ts and
-- candidate-types.ts before writing this migration). These
-- are added as nullable columns with no default, so:
--   - every existing SELECT/INSERT/UPDATE in the app keeps
--     working unchanged (nothing references these columns)
--   - no existing row is affected
--   - they only take effect for the Document Template System,
--     via a dedicated query in template-service.ts that does
--     NOT touch candidate-service.ts
-- =========================================================

alter table public.candidates
  add column if not exists nationality text,
  add column if not exists profession text,
  add column if not exists date_of_birth date,
  add column if not exists address text,
  add column if not exists phone text;
