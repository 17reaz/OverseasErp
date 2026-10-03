-- =========================================================
-- AUDIT LOG
-- ---------------------------------------------------------
-- Immutable, tenant-scoped trail of every insert / update /
-- delete on business tables. Written only by a trigger
-- (security definer); readable only by OWNER and ADMIN.
--
-- tenant_id and actor_id intentionally have NO foreign keys so
-- that deleting a tenant or user never fails because of, or
-- erases, their audit history.
-- =========================================================

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,

  tenant_id uuid not null,
  actor_id uuid,
  actor_name text,
  actor_role text,

  table_name text not null,
  record_id text,
  record_label text,

  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),

  changed_fields text[],
  old_data jsonb,
  new_data jsonb,

  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_created_idx
  on public.audit_logs (tenant_id, created_at desc);

create index if not exists audit_logs_tenant_record_idx
  on public.audit_logs (tenant_id, table_name, record_id);

-- ---------------------------------------------------------
-- RLS: read-only, OWNER / ADMIN of the same tenant
-- ---------------------------------------------------------

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select_admins on public.audit_logs;

create policy audit_logs_select_admins
  on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = audit_logs.tenant_id
        and lower(p.role) in ('owner', 'admin')
    )
  );

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

-- ---------------------------------------------------------
-- Trigger function
-- ---------------------------------------------------------

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_old jsonb;
  v_new jsonb;
  v_data jsonb;
  v_tenant uuid;
  v_name text;
  v_role text;
  v_changed text[];
  v_old_diff jsonb;
  v_new_diff jsonb;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  else
    v_old := to_jsonb(old);
  end if;

  v_data := coalesce(v_new, v_old);

  if v_actor is not null then
    select p.full_name, p.role, p.tenant_id
      into v_name, v_role, v_tenant
      from public.profiles p
      where p.id = v_actor;
  end if;

  v_tenant := coalesce((v_data ->> 'tenant_id')::uuid, v_tenant);

  -- Cannot attribute the row to a tenant: skip silently.
  if v_tenant is null then
    return null;
  end if;

  -- For updates keep only the fields that actually changed.
  if tg_op = 'UPDATE' then
    select
      coalesce(array_agg(n.key order by n.key), '{}'),
      coalesce(jsonb_object_agg(n.key, v_old -> n.key), '{}'::jsonb),
      coalesce(jsonb_object_agg(n.key, n.value), '{}'::jsonb)
    into v_changed, v_old_diff, v_new_diff
    from jsonb_each(v_new) as n
    where n.value is distinct from (v_old -> n.key)
      and n.key not in ('updated_at', 'workflow_updated_at');

    if coalesce(array_length(v_changed, 1), 0) = 0 then
      return null; -- nothing meaningful changed
    end if;

    v_old := v_old_diff;
    v_new := v_new_diff;
  end if;

  insert into public.audit_logs (
    tenant_id, actor_id, actor_name, actor_role,
    table_name, record_id, record_label,
    action, changed_fields, old_data, new_data
  )
  values (
    v_tenant,
    v_actor,
    coalesce(v_name, case when v_actor is null then 'System' end),
    v_role,
    tg_table_name,
    v_data ->> 'id',
    coalesce(
      v_data ->> 'name',
      v_data ->> 'full_name',
      v_data ->> 'title',
      v_data ->> 'passport_no',
      v_data ->> 'invoice_no',
      v_data ->> 'id'
    ),
    tg_op,
    v_changed,
    v_old,
    v_new
  );

  return null;
end;
$$;

-- ---------------------------------------------------------
-- Attach to business tables (skips tables that do not exist)
-- ---------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'candidates', 'agents', 'agencies',
    'medicals', 'mofas', 'fingers', 'police_clearances',
    'trade_tests', 'visas', 'bmet', 'flights',
    'files', 'tasks',
    'parties', 'transactions', 'transaction_groups', 'accounts',
    'sales', 'payroll', 'fixed_costs', 'invoices', 'payables',
    'employees', 'categories',
    'document_templates', 'tenant_numbering_settings',
    'tenant_members'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
      execute format(
        'create trigger audit_%1$s
           after insert or update or delete on public.%1$I
           for each row execute function public.log_audit()',
        t
      );
    end if;
  end loop;
end
$$;