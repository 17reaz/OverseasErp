// supabase/functions/data-import/index.ts
//
// POST body:
// {
//   "import_type": "candidates" | "agents" | "agencies" |
//                   "medical" | "mofa" | "visa" | "flight",
//   "file_path": "tenants/<tenant_id>/imports/2026/09/foo.xlsx",
//   "file_name": "foo.xlsx",
//   "file_size": 12345,
//   "conflict_strategy": "skip" | "update" | "error"   // optional, default "skip"
// }
//
// The frontend uploads the raw file directly to Storage first (its own
// authenticated client is allowed to write under its own tenant's
// imports/ path per the bucket policy), then calls this function with
// the resulting path. This function never inserts data — only parses,
// validates, and records the result. See data-import-commit for the
// mutation step.

import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";

import {
  resolveCaller,
  UnauthorizedError,
} from "../_shared/tenant.ts";

import { parseSheetToObjects } from "../_shared/xlsx-utils.ts";

import {
  validateImportRows,
  type ImportType,
} from "../_shared/import-schemas.ts";

const VALID_IMPORT_TYPES: ImportType[] = [
  "candidates",
  "agents",
  "agencies",
  "medical",
  "mofa",
  "visa",
  "flight",
];

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
  const importType = body.import_type as ImportType;
  const filePath = body.file_path as string;
  const fileName = (body.file_name as string) ?? filePath?.split("/").pop();
  const fileSize = body.file_size as number | undefined;
  const conflictStrategy =
    (body.conflict_strategy as "skip" | "update" | "error") ?? "skip";

  if (!VALID_IMPORT_TYPES.includes(importType)) {
    return jsonResponse(
      { error: `Invalid import_type. Expected one of: ${VALID_IMPORT_TYPES.join(", ")}` },
      400,
    );
  }

  if (!filePath) {
    return jsonResponse({ error: "file_path is required." }, 400);
  }

  // SECURITY: the uploaded path must belong to the caller's own tenant.
  // Never trust that the frontend only ever uploads to its own path —
  // the Storage policy already enforces this on upload, but we verify
  // again here since this function reads with the service_role client.
  const expectedPrefix = `tenants/${caller.tenantId}/imports/`;
  if (!filePath.startsWith(expectedPrefix)) {
    return jsonResponse(
      { error: "file_path does not belong to your tenant." },
      403,
    );
  }

  if (!["skip", "update", "error"].includes(conflictStrategy)) {
    return jsonResponse({ error: "Invalid conflict_strategy." }, 400);
  }

  const { adminClient, userClient, tenantId, userId } = caller;

  const { data: job, error: jobInsertError } = await adminClient
    .from("import_jobs")
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      status: "parsing",
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize ?? null,
      import_type: importType,
      conflict_strategy: conflictStrategy,
    })
    .select()
    .single();

  if (jobInsertError || !job) {
    return jsonResponse({ error: "Failed to create import job." }, 500);
  }

  try {
    // Download the uploaded workbook.
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("erp-backups")
      .download(filePath);

    if (downloadError || !fileData) {
      throw downloadError ?? new Error("Failed to download uploaded file.");
    }

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());
    const rawRows = parseSheetToObjects(fileBytes);

    await adminClient
      .from("import_jobs")
      .update({ status: "validating", total_rows: rawRows.length })
      .eq("id", job.id);

    const { errors, rows } = await validateImportRows(
      userClient,
      importType,
      rawRows,
      conflictStrategy,
    );

    const validRows = rows.filter((r) => r.isValid).length;
    const invalidRows = rows.length - validRows;

    const { data: updatedJob, error: updateError } = await adminClient
      .from("import_jobs")
      .update({
        status: rawRows.length > 0 ? "ready" : "failed",
        total_rows: rawRows.length,
        valid_rows: validRows,
        invalid_rows: invalidRows,
        error_count: errors.length,
        validation_result: { errors, rows },
        error_message:
          rawRows.length === 0 ? "The uploaded file has no data rows." : null,
      })
      .eq("id", job.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return jsonResponse({ job: updatedJob });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown import failure.";

    await adminClient
      .from("import_jobs")
      .update({ status: "failed", error_message: message })
      .eq("id", job.id);

    return jsonResponse({ error: message }, 500);
  }
});
