-- =========================================================
-- STORAGE: erp-backups (PRIVATE)
-- ---------------------------------------------------------
-- Path convention (enforced by policy, not just by convention):
--   tenants/{tenant_id}/exports/{YYYY}/{MM}/{filename}.xlsx
--   tenants/{tenant_id}/imports/{YYYY}/{MM}/{filename}.xlsx
--
-- {tenant_id} in the path MUST equal the caller's own
-- profiles.tenant_id, or the policy denies access.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('erp-backups', 'erp-backups', false)
on conflict (id) do nothing;

-- Helper: first path segment after "tenants/" == caller's tenant_id
-- storage.foldername(name) returns an array of path segments.
-- e.g. tenants/<tenant_id>/exports/2026/09/file.xlsx
--   -> {tenants, <tenant_id>, exports, 2026, 09}
--   -> segment[2] (1-indexed) is the tenant_id

create policy erp_backups_tenant_read
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'erp-backups'
    and (storage.foldername(name))[2] = (
      select tenant_id::text from public.profiles where id = auth.uid()
    )
  );

-- Client-side INSERT is intentionally NOT allowed for exports —
-- export files are written server-side by the `data-export`
-- Edge Function using the service_role key (bypasses RLS).
--
-- Import file uploads DO happen from the browser (the user's own
-- file), so we allow INSERT scoped to the caller's own tenant path.

create policy erp_backups_tenant_import_upload
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'erp-backups'
    and (storage.foldername(name))[2] = (
      select tenant_id::text from public.profiles where id = auth.uid()
    )
    and (storage.foldername(name))[3] = 'imports'
  );

-- No client-side UPDATE/DELETE — jobs are immutable/append-only
-- from the client's perspective; cleanup (if ever needed) happens
-- via service_role from an Edge Function or dashboard.
