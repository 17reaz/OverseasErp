// src/modules/erp/settings/data-management-service.ts
//
// UI components should never call supabase.functions.invoke() or
// supabase.storage directly for this feature — go through this
// service so the Edge Function contract lives in one place.

import { supabase } from "@/lib/supabase/client";

import type {
  ConflictStrategy,
  ExportJob,
  ExportResult,
  ExportType,
  ImportJob,
  ImportType,
} from "./data-management-types";

/* =========================================================
   TENANT RESOLUTION
   ---------------------------------------------------------
   Same pattern as src/lib/supabase/auth.ts — used only to build
   the client-side upload path. The Edge Functions re-resolve
   tenant server-side and never trust this value for authorization.
========================================================= */

async function getCurrentTenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Could not resolve your tenant.");
  }

  return profile.tenant_id as string;
}

/* =========================================================
   EXPORT
========================================================= */

export async function exportData(
  exportType: ExportType,
): Promise<ExportResult> {
  const { data, error } = await supabase.functions.invoke("data-export", {
    body: { export_type: exportType },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as ExportResult;
}

export async function listExportJobs(limit = 20): Promise<ExportJob[]> {
  const { data, error } = await supabase
    .from("export_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ExportJob[];
}

/**
 * Re-signs a completed export's file for download from History (the
 * signed URL returned at export time is short-lived). RLS on
 * storage.objects already scopes this to the caller's own tenant.
 */
export async function getExportDownloadUrl(
  filePath: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("erp-backups")
    .createSignedUrl(filePath, 60 * 10);

  if (error || !data) {
    throw error ?? new Error("Failed to create download link.");
  }

  return data.signedUrl;
}

/* =========================================================
   IMPORT
========================================================= */

/**
 * Uploads the file directly to the private `erp-backups` bucket
 * under the caller's own tenant path, then asks `data-import` to
 * parse + validate it. Returns the import_jobs row (status: "ready"
 * or "failed").
 */
export async function uploadAndValidateImport(
  file: File,
  importType: ImportType,
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportJob> {
  const tenantId = await getCurrentTenantId();

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filePath = `tenants/${tenantId}/imports/${yyyy}/${mm}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("erp-backups")
    .upload(filePath, file, {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase.functions.invoke("data-import", {
    body: {
      import_type: importType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      conflict_strategy: conflictStrategy,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return (data as { job: ImportJob }).job;
}

export async function commitImport(importJobId: string): Promise<ImportJob> {
  const { data, error } = await supabase.functions.invoke(
    "data-import-commit",
    { body: { import_job_id: importJobId } },
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return (data as { job: ImportJob }).job;
}

export async function listImportJobs(limit = 20): Promise<ImportJob[]> {
  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ImportJob[];
}

export async function getImportJob(id: string): Promise<ImportJob> {
  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ImportJob;
}
