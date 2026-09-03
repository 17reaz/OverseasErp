// supabase/functions/_shared/import-schemas.ts
//
// Declarative-ish validators for each import_type. Candidates gets
// the full rule set described in the spec; Agents/Agencies get a
// simple unique-key validator; Medical/Mofa/Visa/Flight get a basic
// "required fields + candidate must exist" validator (insert-only,
// no update/duplicate detection yet — documented v1 scope decision).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ImportType =
  | "candidates"
  | "agents"
  | "agencies"
  | "medical"
  | "mofa"
  | "visa"
  | "flight";

export interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  code: string;
  message: string;
}

export interface NormalizedRow {
  row: number;
  isValid: boolean;
  action: "insert" | "update" | "skip" | "error";
  // Fully-resolved columns ready for insert/update (FKs resolved to
  // UUIDs, dates normalized, etc).
  data: Record<string, unknown>;
  // Present when action === "update" — the existing row's id.
  matchId?: string;
}

export interface ValidationOutcome {
  errors: ValidationError[];
  rows: NormalizedRow[];
}

const CANDIDATE_STAGES = [
  "candidate",
  "medical",
  "mofa",
  "finger",
  "police_clearance",
  "takamul",
  "visa",
  "flight",
];

const CANDIDATE_STATUSES = [
  "active",
  "hold",
  "returned",
  "complete",
  "cancelled",
];

function isValidDate(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  const d = new Date(String(value));
  return !Number.isNaN(d.getTime());
}

/* =========================================================
   CANDIDATES
========================================================= */

async function validateCandidates(
  client: SupabaseClient,
  rawRows: Record<string, unknown>[],
  conflictStrategy: "skip" | "update" | "error",
): Promise<ValidationOutcome> {
  const errors: ValidationError[] = [];
  const rows: NormalizedRow[] = [];

  const seenPassportsInFile = new Map<string, number>();

  // Preload existing passports + SLs for this tenant (RLS-scoped).
  const { data: existingCandidates } = await client
    .from("candidates")
    .select("id, passport_no, sl");

  const existingByPassport = new Map(
    (existingCandidates ?? []).map((c: any) => [c.passport_no, c]),
  );
  const existingSlSet = new Set(
    (existingCandidates ?? []).map((c: any) => c.sl).filter(Boolean),
  );

  const { data: agents } = await client.from("agents").select("id, name");
  const agentByName = new Map(
    (agents ?? []).map((a: any) => [String(a.name).trim().toLowerCase(), a.id]),
  );

  rawRows.forEach((raw, index) => {
    const rowNum = index + 2; // header is row 1
    const rowErrors: ValidationError[] = [];

    const name = raw["Candidate Name"];
    const passportNo = raw["Passport No"];
    const stage = raw["Current Stage"] || "candidate";
    const agentName = raw["Agent Name"];
    const receivedDate = raw["Received Date"];
    const status = raw["Status"];
    const returnedDate = raw["Returned Date"];
    const slRaw = raw["SL"];

    if (!name) {
      rowErrors.push({
        row: rowNum,
        field: "Candidate Name",
        value: name,
        code: "REQUIRED",
        message: "Candidate Name is required.",
      });
    }

    if (!passportNo) {
      rowErrors.push({
        row: rowNum,
        field: "Passport No",
        value: passportNo,
        code: "REQUIRED",
        message: "Passport No is required.",
      });
    } else if (!/^[A-Za-z0-9]{5,20}$/.test(String(passportNo))) {
      rowErrors.push({
        row: rowNum,
        field: "Passport No",
        value: passportNo,
        code: "INVALID_FORMAT",
        message: "Passport No must be 5-20 alphanumeric characters.",
      });
    }

    if (passportNo) {
      const key = String(passportNo).trim().toUpperCase();
      if (seenPassportsInFile.has(key)) {
        rowErrors.push({
          row: rowNum,
          field: "Passport No",
          value: passportNo,
          code: "DUPLICATE_IN_FILE",
          message: `Duplicate Passport No within the uploaded file (also row ${seenPassportsInFile.get(key)}).`,
        });
      } else {
        seenPassportsInFile.set(key, rowNum);
      }
    }

    const existing = passportNo
      ? existingByPassport.get(String(passportNo))
      : undefined;

    if (existing && conflictStrategy === "error") {
      rowErrors.push({
        row: rowNum,
        field: "Passport No",
        value: passportNo,
        code: "DUPLICATE_PASSPORT",
        message: "Passport number already exists in this tenant.",
      });
    }

    if (stage && !CANDIDATE_STAGES.includes(String(stage))) {
      rowErrors.push({
        row: rowNum,
        field: "Current Stage",
        value: stage,
        code: "INVALID_STAGE",
        message: `Current Stage must be one of: ${CANDIDATE_STAGES.join(", ")}.`,
      });
    }

    let agentId: string | null = null;
    if (agentName) {
      agentId = agentByName.get(String(agentName).trim().toLowerCase()) ?? null;
      if (!agentId) {
        rowErrors.push({
          row: rowNum,
          field: "Agent Name",
          value: agentName,
          code: "INVALID_AGENT",
          message: `Agent "${agentName}" was not found in this tenant.`,
        });
      }
    }

    if (!isValidDate(receivedDate)) {
      rowErrors.push({
        row: rowNum,
        field: "Received Date",
        value: receivedDate,
        code: "INVALID_DATE",
        message: "Received Date is not a valid date.",
      });
    }

    if (!isValidDate(returnedDate)) {
      rowErrors.push({
        row: rowNum,
        field: "Returned Date",
        value: returnedDate,
        code: "INVALID_DATE",
        message: "Returned Date is not a valid date.",
      });
    }

    if (status && !CANDIDATE_STATUSES.includes(String(status).toLowerCase())) {
      rowErrors.push({
        row: rowNum,
        field: "Status",
        value: status,
        code: "INVALID_STATUS",
        message: `Status must be one of: ${CANDIDATE_STATUSES.join(", ")}.`,
      });
    }

    let sl: number | null = null;
    if (slRaw !== null && slRaw !== undefined && slRaw !== "") {
      const parsed = Number(slRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        rowErrors.push({
          row: rowNum,
          field: "SL",
          value: slRaw,
          code: "INVALID_SL",
          message: "SL must be a positive integer.",
        });
      } else {
        sl = parsed;
        // SL conflict: an existing candidate has this SL and it is
        // NOT the same candidate being updated -> never auto-renumber.
        const clashesWith = (existingCandidates ?? []).find(
          (c: any) => c.sl === sl && c.passport_no !== passportNo,
        );
        if (clashesWith) {
          rowErrors.push({
            row: rowNum,
            field: "SL",
            value: slRaw,
            code: "SL_CONFLICT",
            message: `SL ${sl} already belongs to another candidate in this tenant.`,
          });
        }
      }
    }

    errors.push(...rowErrors);

    const isValid = rowErrors.length === 0;
    let action: NormalizedRow["action"] = "error";

    if (isValid) {
      if (existing) {
        action = conflictStrategy === "update" ? "update" : "skip";
      } else {
        action = "insert";
      }
    }

    const data: Record<string, unknown> = {
      name,
      passport_no: passportNo,
      current_stage: stage || "candidate",
      agent_id: agentId,
      received_date: receivedDate || null,
      sl: sl,
    };

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      if (normalizedStatus === "cancelled") data.final_status = "cancelled";
      if (normalizedStatus === "complete") data.final_status = "complete";
      if (normalizedStatus === "returned") {
        data.is_returned = true;
        data.returned_date = returnedDate || null;
      }
    }

    rows.push({
      row: rowNum,
      isValid,
      action,
      data,
      matchId: existing?.id,
    });
  });

  return { errors, rows };
}

/* =========================================================
   AGENTS / AGENCIES (simple, unique-by-code)
========================================================= */

async function validateSimpleNamedEntity(
  client: SupabaseClient,
  table: "agents" | "agencies",
  rawRows: Record<string, unknown>[],
  conflictStrategy: "skip" | "update" | "error",
): Promise<ValidationOutcome> {
  const errors: ValidationError[] = [];
  const rows: NormalizedRow[] = [];

  const { data: existing } = await client.from(table).select("id, code");
  const existingByCode = new Map(
    (existing ?? []).map((e: any) => [String(e.code).toUpperCase(), e]),
  );

  const seenInFile = new Map<string, number>();

  rawRows.forEach((raw, index) => {
    const rowNum = index + 2;
    const rowErrors: ValidationError[] = [];

    const name = raw["Name"];
    const code = raw["Code"];

    if (!name) {
      rowErrors.push({
        row: rowNum,
        field: "Name",
        value: name,
        code: "REQUIRED",
        message: "Name is required.",
      });
    }
    if (!code) {
      rowErrors.push({
        row: rowNum,
        field: "Code",
        value: code,
        code: "REQUIRED",
        message: "Code is required.",
      });
    }

    if (code) {
      const key = String(code).toUpperCase();
      if (seenInFile.has(key)) {
        rowErrors.push({
          row: rowNum,
          field: "Code",
          value: code,
          code: "DUPLICATE_IN_FILE",
          message: `Duplicate Code within the uploaded file (also row ${seenInFile.get(key)}).`,
        });
      } else {
        seenInFile.set(key, rowNum);
      }
    }

    const match = code ? existingByCode.get(String(code).toUpperCase()) : undefined;

    if (match && conflictStrategy === "error") {
      rowErrors.push({
        row: rowNum,
        field: "Code",
        value: code,
        code: "DUPLICATE_CODE",
        message: "Code already exists in this tenant.",
      });
    }

    errors.push(...rowErrors);
    const isValid = rowErrors.length === 0;

    let action: NormalizedRow["action"] = "error";
    if (isValid) {
      action = match ? (conflictStrategy === "update" ? "update" : "skip") : "insert";
    }

    rows.push({
      row: rowNum,
      isValid,
      action,
      data: { name, code, ...(table === "agencies" ? { is_active: true } : {}) },
      matchId: match?.id,
    });
  });

  return { errors, rows };
}

/* =========================================================
   MEDICAL / MOFA / VISA / FLIGHT
   ---------------------------------------------------------
   v1 scope: insert-only, linked to an existing candidate by
   Passport No. No duplicate/update detection yet — every valid
   row is a fresh insert. Extend by adding a natural key per
   module (e.g. Visa No, Flight No + Date) the same way
   Candidates/Agents/Agencies do it above.
========================================================= */

async function validateCandidateLinkedModule(
  client: SupabaseClient,
  table: "medicals" | "mofas" | "visas" | "flights",
  requiredFields: string[],
  buildData: (raw: Record<string, unknown>, candidateId: string) => Record<string, unknown>,
  rawRows: Record<string, unknown>[],
): Promise<ValidationOutcome> {
  const errors: ValidationError[] = [];
  const rows: NormalizedRow[] = [];

  const { data: candidates } = await client
    .from("candidates")
    .select("id, passport_no");
  const candidateByPassport = new Map(
    (candidates ?? []).map((c: any) => [c.passport_no, c.id]),
  );

  rawRows.forEach((raw, index) => {
    const rowNum = index + 2;
    const rowErrors: ValidationError[] = [];

    const passportNo = raw["Passport No"];
    if (!passportNo) {
      rowErrors.push({
        row: rowNum,
        field: "Passport No",
        value: passportNo,
        code: "REQUIRED",
        message: "Passport No is required to link to a candidate.",
      });
    }

    const candidateId = passportNo
      ? candidateByPassport.get(String(passportNo))
      : undefined;

    if (passportNo && !candidateId) {
      rowErrors.push({
        row: rowNum,
        field: "Passport No",
        value: passportNo,
        code: "INVALID_CANDIDATE",
        message: `No candidate found with Passport No "${passportNo}" in this tenant.`,
      });
    }

    for (const field of requiredFields) {
      if (!raw[field]) {
        rowErrors.push({
          row: rowNum,
          field,
          value: raw[field],
          code: "REQUIRED",
          message: `${field} is required.`,
        });
      }
    }

    errors.push(...rowErrors);
    const isValid = rowErrors.length === 0;

    rows.push({
      row: rowNum,
      isValid,
      action: isValid ? "insert" : "error",
      data: isValid ? buildData(raw, candidateId!) : {},
    });
  });

  return { errors, rows: rows.map((r) => ({ ...r, data: { ...r.data, table } })) };
}

/* =========================================================
   DISPATCH
========================================================= */

export async function validateImportRows(
  client: SupabaseClient,
  importType: ImportType,
  rawRows: Record<string, unknown>[],
  conflictStrategy: "skip" | "update" | "error",
): Promise<ValidationOutcome> {
  switch (importType) {
    case "candidates":
      return validateCandidates(client, rawRows, conflictStrategy);

    case "agents":
      return validateSimpleNamedEntity(client, "agents", rawRows, conflictStrategy);

    case "agencies":
      return validateSimpleNamedEntity(client, "agencies", rawRows, conflictStrategy);

    case "medical":
      return validateCandidateLinkedModule(
        client,
        "medicals",
        ["Status"],
        (raw, candidateId) => ({
          candidate_id: candidateId,
          medical_date: raw["Medical Date"] || null,
          fit_date: raw["Fit Date"] || null,
          status: raw["Status"],
        }),
        rawRows,
      );

    case "mofa":
      return validateCandidateLinkedModule(
        client,
        "mofas",
        ["Application Number"],
        (raw, candidateId) => ({
          candidate_id: candidateId,
          application_number: raw["Application Number"],
          application_date: raw["Application Date"] || null,
          trade: raw["Trade"] || null,
          stage: raw["Stage"] || "new",
        }),
        rawRows,
      );

    case "visa":
      return validateCandidateLinkedModule(
        client,
        "visas",
        ["Visa No"],
        (raw, candidateId) => ({
          candidate_id: candidateId,
          visa_no: raw["Visa No"],
          visa_date: raw["Visa Date"] || null,
          expiry_date: raw["Expiry Date"] || null,
          visa_type: raw["Type"] || null,
          status: raw["Status"] || null,
          remarks: raw["Remarks"] || null,
        }),
        rawRows,
      );

    case "flight":
      return validateCandidateLinkedModule(
        client,
        "flights",
        [],
        (raw, candidateId) => ({
          candidate_id: candidateId,
          flight_date: raw["Flight Date"] || null,
          flight_no: raw["Flight No"] || null,
          airline: raw["Airline"] || null,
          departure_city: raw["Departure"] || null,
          arrival_city: raw["Arrival"] || null,
          status: raw["Status"] || "scheduled",
          remarks: raw["Remarks"] || null,
        }),
        rawRows,
      );

    default:
      throw new Error(`Unknown import_type: ${importType}`);
  }
}
