// supabase/functions/data-import-commit/index.ts
//
// POST body: { "import_job_id": "<uuid>" }
//
// Applies the rows stored on a `ready` import_jobs row to the
// database. Row-by-row (Postgres via PostgREST has no cross-row
// client transaction here — see NOTE below), reporting exactly what
// happened per the spec's "do not partially mutate without reporting"
// requirement.
//
// NOTE ON TRANSACTIONALITY:
// A true single all-or-nothing transaction across many rows would
// require a Postgres function (RPC) wrapping the whole batch. This
// v1 commits row-by-row and reports inserted/updated/skipped/error
// counts precisely, so nothing is silently lost — but a failure
// partway through does not roll back earlier rows in the same job.
// If atomic all-or-nothing commits become a hard requirement, move
// this loop into a `plpgsql` function and call it via `adminClient.rpc()`.

import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";

import {
  resolveCaller,
  UnauthorizedError,
} from "../_shared/tenant.ts";

import type { NormalizedRow } from "../_shared/import-schemas.ts";

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
  const importJobId = body.import_job_id as string;

  if (!importJobId) {
    return jsonResponse({ error: "import_job_id is required." }, 400);
  }

  const { adminClient, tenantId, userId } = caller;

  // Tenant check is explicit here too — service_role bypasses RLS.
  const { data: job, error: jobError } = await adminClient
    .from("import_jobs")
    .select("*")
    .eq("id", importJobId)
    .eq("tenant_id", tenantId)
    .single();

  if (jobError || !job) {
    return jsonResponse({ error: "Import job not found." }, 404);
  }

  if (job.status !== "ready") {
    return jsonResponse(
      { error: `Import job is not ready to commit (status: ${job.status}).` },
      400,
    );
  }

  await adminClient
    .from("import_jobs")
    .update({ status: "committing" })
    .eq("id", job.id);

  const rows: NormalizedRow[] = job.validation_result?.rows ?? [];
  const commitErrors: { row: number; message: string }[] = [];

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.action === "error") continue; // never committed, already invalid

    try {
      if (row.action === "skip") {
        skipped++;
        continue;
      }

      const table = resolveTargetTable(job.import_type, row);
      const payload = buildInsertPayload(job.import_type, row, tenantId, userId);

      if (row.action === "insert") {
        const { error } = await adminClient.from(table).insert(payload);
        if (error) throw error;
        inserted++;
      } else if (row.action === "update" && row.matchId) {
        const { error } = await adminClient
          .from(table)
          .update(payload)
          .eq("id", row.matchId)
          .eq("tenant_id", tenantId);
        if (error) throw error;
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown row error.";
      commitErrors.push({ row: row.row, message });
      skipped++;
    }
  }

  const finalStatus = commitErrors.length === rows.length && rows.length > 0
    ? "failed"
    : "completed";

  const { data: completedJob, error: updateError } = await adminClient
    .from("import_jobs")
    .update({
      status: finalStatus,
      inserted_rows: inserted,
      updated_rows: updated,
      skipped_rows: skipped,
      committed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_message:
        commitErrors.length > 0
          ? `${commitErrors.length} row(s) failed during commit. See validation_result for details.`
          : null,
      validation_result: {
        ...job.validation_result,
        commitErrors,
      },
    })
    .eq("id", job.id)
    .select()
    .single();

  if (updateError) {
    return jsonResponse({ error: "Failed to finalize import job." }, 500);
  }

  return jsonResponse({ job: completedJob });
});

function resolveTargetTable(importType: string, row: NormalizedRow): string {
  if (importType === "candidates") return "candidates";
  if (importType === "agents") return "agents";
  if (importType === "agencies") return "agencies";
  // Candidate-linked modules stash their physical table name on the row.
  return String(row.data.table);
}

function buildInsertPayload(
  importType: string,
  row: NormalizedRow,
  tenantId: string,
  userId: string,
): Record<string, unknown> {
  const { table: _table, ...data } = row.data as Record<string, unknown>;

  // Omit `sl` when not provided so the database's own numbering
  // default/trigger generates it — never insert an explicit null
  // over a generator (spec #12).
  if (data.sl === null || data.sl === undefined) {
    delete data.sl;
  }

  const payload: Record<string, unknown> = { ...data, tenant_id: tenantId };

  if (row.action === "insert" && importType === "candidates") {
    payload.created_by = userId;
  }

  return payload;
}
