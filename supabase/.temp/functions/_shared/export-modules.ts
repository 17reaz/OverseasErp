// supabase/functions/_shared/export-modules.ts

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { SheetDefinition } from "./xlsx-utils.ts";
import { deriveCandidateDisplayStatus } from "./candidate-status.ts";

export type ExportType =
  | "all"
  | "candidates"
  | "agents"
  | "agencies"
  | "medical"
  | "mofa"
  | "visa"
  | "flight";

/* =========================================================
   Every builder receives the CALLER-SCOPED client (RLS applies
   automatically, so no manual tenant_id filtering is needed or
   trusted here — this is the "query tenant-scoped data" step).
========================================================= */

async function buildCandidatesSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("candidates")
    .select(
      `
      sl, name, passport_no, current_stage, received_date,
      final_status, is_returned, returned_date,
      agent:agent_id ( name )
      `,
    )
    .order("sl", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((c: any) => [
    c.sl,
    c.name,
    c.passport_no,
    c.current_stage ?? "candidate",
    c.agent?.name ?? "",
    c.received_date,
    deriveCandidateDisplayStatus({
      final_status: c.final_status,
      is_returned: c.is_returned,
    }),
    c.returned_date,
  ]);

  return {
    name: "Candidates",
    headers: [
      "SL",
      "Candidate Name",
      "Passport No",
      "Current Stage",
      "Agent Name",
      "Received Date",
      "Status",
      "Returned Date",
    ],
    rows,
  };
}

async function buildAgentsSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("agents")
    .select("id, name, code, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return {
    name: "Agents",
    headers: ["Name", "Code", "Created At"],
    rows: (data ?? []).map((a: any) => [a.name, a.code, a.created_at]),
  };
}

async function buildAgenciesSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("agencies")
    .select("sl, name, code, phone, email, address, is_active")
    .order("sl", { ascending: true });

  if (error) throw error;

  return {
    name: "Agencies",
    headers: ["SL", "Name", "Code", "Phone", "Email", "Address", "Active"],
    rows: (data ?? []).map((a: any) => [
      a.sl,
      a.name,
      a.code,
      a.phone,
      a.email,
      a.address,
      a.is_active ? "Yes" : "No",
    ]),
  };
}

async function buildMedicalSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("medicals")
    .select(
      `
      medical_date, fit_date, status,
      candidate:candidate_id ( sl, name, passport_no )
      `,
    )
    .order("medical_date", { ascending: true });

  if (error) throw error;

  return {
    name: "Medicals",
    headers: [
      "SL",
      "Candidate Name",
      "Passport No",
      "Medical Date",
      "Fit Date",
      "Status",
    ],
    rows: (data ?? []).map((m: any) => [
      m.candidate?.sl,
      m.candidate?.name,
      m.candidate?.passport_no,
      m.medical_date,
      m.fit_date,
      m.status,
    ]),
  };
}

async function buildMofaSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("mofas")
    .select(
      `
      sl, application_number, application_date, trade, stage,
      candidate:candidate_id ( name, passport_no ),
      agency:agency_id ( name )
      `,
    )
    .order("sl", { ascending: true });

  if (error) throw error;

  return {
    name: "Mofas",
    headers: [
      "SL",
      "Candidate Name",
      "Passport No",
      "Application Number",
      "Application Date",
      "Trade",
      "Agency",
      "Stage",
    ],
    rows: (data ?? []).map((m: any) => [
      m.sl,
      m.candidate?.name,
      m.candidate?.passport_no,
      m.application_number,
      m.application_date,
      m.trade,
      m.agency?.name,
      m.stage,
    ]),
  };
}

async function buildVisaSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("visas")
    .select(
      `
      sl, visa_no, visa_date, expiry_date, visa_type, status, remarks,
      candidate:candidate_id ( name, passport_no )
      `,
    )
    .order("sl", { ascending: true });

  if (error) throw error;

  return {
    name: "Visas",
    headers: [
      "SL",
      "Candidate Name",
      "Passport No",
      "Visa No",
      "Visa Date",
      "Expiry Date",
      "Type",
      "Status",
      "Remarks",
    ],
    rows: (data ?? []).map((v: any) => [
      v.sl,
      v.candidate?.name,
      v.candidate?.passport_no,
      v.visa_no,
      v.visa_date,
      v.expiry_date,
      v.visa_type,
      v.status,
      v.remarks,
    ]),
  };
}

async function buildFlightSheet(
  client: SupabaseClient,
): Promise<SheetDefinition> {
  const { data, error } = await client
    .from("flights")
    .select(
      `
      sl, flight_date, flight_no, airline, departure_city,
      arrival_city, status, remarks,
      candidate:candidate_id ( name, passport_no )
      `,
    )
    .order("sl", { ascending: true });

  if (error) throw error;

  return {
    name: "Flights",
    headers: [
      "SL",
      "Candidate Name",
      "Passport No",
      "Flight Date",
      "Flight No",
      "Airline",
      "Departure",
      "Arrival",
      "Status",
      "Remarks",
    ],
    rows: (data ?? []).map((f: any) => [
      f.sl,
      f.candidate?.name,
      f.candidate?.passport_no,
      f.flight_date,
      f.flight_no,
      f.airline,
      f.departure_city,
      f.arrival_city,
      f.status,
      f.remarks,
    ]),
  };
}

function buildDashboardSheet(sheets: SheetDefinition[]): SheetDefinition {
  return {
    name: "Dashboard",
    headers: ["Sheet", "Record Count"],
    rows: sheets.map((s) => [s.name, s.rows.length]),
  };
}

const SINGLE_BUILDERS: Record<
  Exclude<ExportType, "all">,
  (client: SupabaseClient) => Promise<SheetDefinition>
> = {
  candidates: buildCandidatesSheet,
  agents: buildAgentsSheet,
  agencies: buildAgenciesSheet,
  medical: buildMedicalSheet,
  mofa: buildMofaSheet,
  visa: buildVisaSheet,
  flight: buildFlightSheet,
};

/**
 * Returns the sheets for the requested export_type. "all" produces a
 * Dashboard summary sheet followed by every module sheet.
 */
export async function buildExportSheets(
  client: SupabaseClient,
  exportType: ExportType,
): Promise<SheetDefinition[]> {
  if (exportType === "all") {
    const sheets = await Promise.all([
      buildCandidatesSheet(client),
      buildAgentsSheet(client),
      buildAgenciesSheet(client),
      buildMedicalSheet(client),
      buildMofaSheet(client),
      buildVisaSheet(client),
      buildFlightSheet(client),
    ]);

    return [buildDashboardSheet(sheets), ...sheets];
  }

  const builder = SINGLE_BUILDERS[exportType];
  if (!builder) {
    throw new Error(`Unknown export_type: ${exportType}`);
  }

  return [await builder(client)];
}
