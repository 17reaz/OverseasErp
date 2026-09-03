// supabase/functions/data-export/index.ts
//
// POST body: { "export_type": "all" | "candidates" | "agents" |
//               "agencies" | "medical" | "mofa" | "visa" | "flight" }
//
// Flow: authenticate -> resolve tenant -> query tenant-scoped data
// (RLS, via the caller's own client) -> build XLSX -> upload to the
// private `erp-backups` bucket (service_role) -> create export_jobs
// row -> return a short-lived signed download URL.

import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";

import {
  resolveCaller,
  UnauthorizedError,
} from "../_shared/tenant.ts";

import {
  buildExportSheets,
  type ExportType,
} from "../_shared/export-modules.ts";

import { buildWorkbook } from "../_shared/xlsx-utils.ts";

const VALID_EXPORT_TYPES: ExportType[] = [
  "all",
  "candidates",
  "agents",
  "agencies",
  "medical",
  "mofa",
  "visa",
  "flight",
];

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let caller;
  try {
    caller = await resolveCaller(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonResponse({ error: err.message }, 401);
    }
    return jsonResponse({ error: "Authentication failed." }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const exportType = body.export_type as ExportType;

  if (!VALID_EXPORT_TYPES.includes(exportType)) {
    return jsonResponse(
      {
        error: `Invalid export_type. Expected one of: ${VALID_EXPORT_TYPES.join(", ")}`,
      },
      400,
    );
  }

  const { userClient, adminClient, tenantId, userId } = caller;

  // Create the job row up front (status: processing).
  const { data: job, error: jobInsertError } = await adminClient
    .from("export_jobs")
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      status: "processing",
      export_type: exportType,
      format: "xlsx",
    })
    .select()
    .single();

  if (jobInsertError || !job) {
    return jsonResponse(
      { error: "Failed to create export job." },
      500,
    );
  }

  try {
    // 1. Query tenant-scoped data (RLS via the caller's own client).
    const sheets = await buildExportSheets(userClient, exportType);
    const recordCount = sheets.reduce((sum, s) => sum + s.rows.length, 0);

    // 2. Build the workbook.
    const fileBytes = buildWorkbook(sheets);

    // 3. Resolve tenant slug for a predictable filename.
    const { data: tenant } = await userClient
      .from("tenants")
      .select("slug")
      .eq("id", tenantId)
      .single();

    const tenantSlug = tenant?.slug ?? tenantId;
    const today = new Date();
    const yyyy = String(today.getUTCFullYear());
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");

    const fileName = `overseas-erp-${tenantSlug}-export-${exportType}-${yyyy}-${mm}-${dd}.xlsx`;
    const filePath = `tenants/${tenantId}/exports/${yyyy}/${mm}/${fileName}`;

    // 4. Upload to private storage (service_role — export path is not
    //    client-writable by policy).
    const { error: uploadError } = await adminClient.storage
      .from("erp-backups")
      .upload(filePath, fileBytes, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 5. Signed URL for the frontend to download.
    const { data: signedUrlData, error: signedUrlError } =
      await adminClient.storage
        .from("erp-backups")
        .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

    if (signedUrlError || !signedUrlData) {
      throw signedUrlError ?? new Error("Failed to create signed URL.");
    }

    // 6. Mark job completed.
    const { data: completedJob, error: updateError } = await adminClient
      .from("export_jobs")
      .update({
        status: "completed",
        file_path: filePath,
        file_name: fileName,
        file_size: fileBytes.byteLength,
        record_count: recordCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return jsonResponse({
      job: completedJob,
      signedUrl: signedUrlData.signedUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown export failure.";

    await adminClient
      .from("export_jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return jsonResponse({ error: message }, 500);
  }
});
