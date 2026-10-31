import { supabase } from "@/lib/supabase/client";

import type {
  CandidateWorkflowState,
  MainCandidateStatus,
} from "./workflow-types";

/* =========================================================
   CONSTANTS
========================================================= */

export const WORKFLOW_VALIDITY = {
  medicalDays: 60,
  mofaDays: 30,
  visaDays: 90,
  iqamaDays: 90,
} as const;

const MOFA_BLOCKED_STAGES = ["cancelled", "canceled", "invalid", "expired"];
const FINGER_BLOCKED_STATUSES = ["failed", "cancelled"];
const TAKAMUL_BLOCKED_STATUSES = ["expired", "cancelled"];
const VISA_ISSUED_STATUSES = ["issued", "approved"];

/* =========================================================
   TYPES
========================================================= */

type HoldReason = CandidateWorkflowState["holdReason"];

export interface WorkflowCandidateInput {
  id: string;
  current_stage: string | null;
  is_returned?: boolean | null;
  final_status?: string | null;
}

interface WorkflowInput {
  is_returned?: boolean | null;
  final_status?: string | null;
  current_stage?: string | null;

  medicalDate?: string | null;
  medicalStatus?: string | null;

  mofaDate?: string | null;
  mofaStage?: string | null;

  fingerExists?: boolean;
  fingerStatus?: string | null;

  policeClearanceExists?: boolean;
  policeClearanceVerified?: boolean;

  takamulExists?: boolean;
  takamulResult?: string | null;
  takamulStatus?: string | null;

  visaExists?: boolean;
  visaDate?: string | null;
  visaExpiryDate?: string | null;
  visaStatus?: string | null;

  bmetExists?: boolean;
  bmetCompleted?: boolean;

  flightDate?: string | null;
  flightStatus?: string | null;

  iqamaCompleted?: boolean;
}

/** Row shapes returned by the per-stage tables. */
interface MedicalRow {
  medical_date: string | null;
  fit_date: string | null;
  status: string | null;
}
interface MofaRow {
  application_date: string | null;
  stage: string | null;
}
interface FingerRow {
  status: string | null;
}
interface PoliceRow {
  verified: boolean | null;
}
interface TakamulRow {
  result: string | null;
  status: string | null;
}
interface VisaRow {
  visa_date: string | null;
  expiry_date: string | null;
  status: string | null;
}
interface BmetRow {
  bmet: boolean | null;
}
interface FlightRow {
  flight_date: string | null;
  status: string | null;
}

interface StageRows {
  medical?: MedicalRow | null;
  mofa?: MofaRow | null;
  finger?: FingerRow | null;
  police?: PoliceRow | null;
  takamul?: TakamulRow | null;
  visa?: VisaRow | null;
  bmet?: BmetRow | null;
  flight?: FlightRow | null;
}

/* =========================================================
   HELPERS
========================================================= */

function addDays(dateString: string, days: number): Date {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date;
}

function isExpired(
  dateString: string | null | undefined,
  days: number,
): boolean {
  if (!dateString) return false;
  return addDays(dateString, days).getTime() < Date.now();
}

function normalizeValue(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function processing(currentStage: string | null): CandidateWorkflowState {
  return {
    mainStatus: "active",
    workflowState: "processing",
    currentStage,
    holdReason: null,
  };
}

function hold(
  currentStage: string | null,
  holdReason: HoldReason,
): CandidateWorkflowState {
  return {
    mainStatus: "active",
    workflowState: "hold",
    currentStage,
    holdReason,
  };
}

/* =========================================================
   MAIN CANDIDATE STATUS
========================================================= */

export function getMainCandidateStatus(candidate: {
  is_returned?: boolean | null;
  final_status?: string | null;
}): MainCandidateStatus {
  if (candidate.is_returned === true) return "return";
  if (candidate.final_status === "complete") return "complete";
  if (candidate.final_status === "cancelled") return "cancel";
  return "active";
}

/* =========================================================
   STAGE CHECKS

   Each check returns a state if the candidate is stopped
   at that stage, or null to continue to the next one.

   Order:
   Flight/Iqama → Medical → MOFA → Finger → Police
   → Takamul (optional) → Visa → BMET → Flight
========================================================= */

type StageCheck = (input: WorkflowInput) => CandidateWorkflowState | null;

function isVisaIssued(input: WorkflowInput): boolean {
  return VISA_ISSUED_STATUSES.includes(normalizeValue(input.visaStatus));
}

/** Flight departed → Iqama, or any active flight → Flight. */
const checkFlightAndIqama: StageCheck = (input) => {
  const flightStatus = normalizeValue(input.flightStatus);

  if (flightStatus === "departed" && input.iqamaCompleted !== true) {
    const overdue =
      input.flightDate &&
      isExpired(input.flightDate, WORKFLOW_VALIDITY.iqamaDays);

    return overdue ? hold("iqama", "iqama_overdue") : processing("iqama");
  }

  if (flightStatus && flightStatus !== "cancelled") {
    return processing("flight");
  }

  if (input.iqamaCompleted === true) {
    return processing("iqama");
  }

  return null;
};

const checkMedical: StageCheck = (input) => {
  const status = normalizeValue(input.medicalStatus);

  if (!status) {
    return hold(input.current_stage ?? null, "received");
  }

  if (status === "new" || status === "pending") {
    return hold(input.current_stage ?? "medical", "received");
  }

  if (status === "unfit" || status === "fail") {
    return hold("medical", "manual_hold");
  }

  // Medical validity only matters until the visa is issued.
  if (status === "fit" && input.medicalDate && !isVisaIssued(input)) {
    const mofaStarted = Boolean(input.mofaDate || input.mofaStage);

    const validityDays = mofaStarted
      ? WORKFLOW_VALIDITY.medicalDays + WORKFLOW_VALIDITY.mofaDays
      : WORKFLOW_VALIDITY.medicalDays;

    if (isExpired(input.medicalDate, validityDays)) {
      return mofaStarted
        ? hold("mofa", "mofa_expired")
        : hold("medical", "medical_expired");
    }
  }

  return null;
};

const checkMofa: StageCheck = (input) => {
  if (!input.mofaDate && !input.mofaStage) {
    return processing("mofa");
  }

  if (MOFA_BLOCKED_STAGES.includes(normalizeValue(input.mofaStage))) {
    return hold("mofa", "manual_hold");
  }

  return null;
};

/** Uses the separate fingers table (BMET finger checkbox is NOT used). */
const checkFinger: StageCheck = (input) => {
  if (!input.fingerExists) {
    return processing("finger");
  }

  const status = normalizeValue(input.fingerStatus);

  if (status === "completed") return null;

  return FINGER_BLOCKED_STATUSES.includes(status)
    ? hold("finger", "manual_hold")
    : processing("finger");
};

const checkPoliceClearance: StageCheck = (input) => {
  if (!input.policeClearanceExists || input.policeClearanceVerified !== true) {
    return processing("police_clearance");
  }
  return null;
};

/** Optional: if a trade test record exists, the result must be "pass". */
const checkTakamul: StageCheck = (input) => {
  if (!input.takamulExists) return null;

  const result = normalizeValue(input.takamulResult);
  const status = normalizeValue(input.takamulStatus);

  if (result === "fail" || TAKAMUL_BLOCKED_STATUSES.includes(status)) {
    return hold("takamul", "manual_hold");
  }

  return result === "pass" ? null : processing("takamul");
};

const checkVisa: StageCheck = (input) => {
  if (!input.visaExists) {
    return processing("visa");
  }

  const hasExpired =
    normalizeValue(input.visaStatus) === "expired" ||
    (input.visaExpiryDate
      ? new Date(input.visaExpiryDate).getTime() < Date.now()
      : isExpired(input.visaDate, WORKFLOW_VALIDITY.visaDays));

  if (hasExpired) {
    return hold("visa", "visa_expired");
  }

  return isVisaIssued(input) ? null : processing("visa");
};

const checkBmet: StageCheck = (input) => {
  if (!input.bmetExists || input.bmetCompleted !== true) {
    return processing("bmet");
  }
  return null;
};

const STAGE_CHECKS: StageCheck[] = [
  checkFlightAndIqama,
  checkMedical,
  checkMofa,
  checkFinger,
  checkPoliceClearance,
  checkTakamul,
  checkVisa,
  checkBmet,
];

/* =========================================================
   CALCULATE WORKFLOW STATE
========================================================= */

export function calculateWorkflowState(
  input: WorkflowInput,
): CandidateWorkflowState {
  const mainStatus = getMainCandidateStatus(input);

  if (mainStatus !== "active") {
    return {
      mainStatus,
      workflowState: "processing",
      currentStage: input.current_stage ?? null,
      holdReason: null,
    };
  }

  for (const check of STAGE_CHECKS) {
    const state = check(input);
    if (state) return state;
  }

  // BMET complete → waiting for flight record.
  return processing("flight");
}

/* =========================================================
   BUILD INPUT FROM DB ROWS
   (shared by single and batch calculation)
========================================================= */

function buildWorkflowInput(
  candidate: {
    current_stage: string | null;
    is_returned?: boolean | null;
    final_status?: string | null;
  },
  rows: StageRows,
): WorkflowInput {
  const { medical, mofa, finger, police, takamul, visa, bmet, flight } = rows;

  return {
    is_returned: candidate.is_returned ?? false,
    final_status: candidate.final_status ?? null,
    current_stage: candidate.current_stage,

    medicalDate: medical?.fit_date ?? medical?.medical_date ?? null,
    medicalStatus: medical?.status ?? null,

    mofaDate: mofa?.application_date ?? null,
    mofaStage: mofa?.stage ?? null,

    fingerExists: Boolean(finger),
    fingerStatus: finger?.status ?? null,

    policeClearanceExists: Boolean(police),
    policeClearanceVerified: police?.verified ?? false,

    takamulExists: Boolean(takamul),
    takamulResult: takamul?.result ?? null,
    takamulStatus: takamul?.status ?? null,

    visaExists: Boolean(visa),
    visaDate: visa?.visa_date ?? null,
    visaExpiryDate: visa?.expiry_date ?? null,
    visaStatus: visa?.status ?? null,

    bmetExists: Boolean(bmet),
    bmetCompleted: bmet?.bmet ?? false,

    flightDate: flight?.flight_date ?? null,
    flightStatus: flight?.status ?? null,

    // No dedicated Iqama table is connected yet.
    iqamaCompleted: false,
  };
}

/* =========================================================
   SAVE WORKFLOW STATE
========================================================= */

export async function saveWorkflowState(
  candidateId: string,
  state: CandidateWorkflowState,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("candidates")
    .update({
      workflow_state: state.workflowState,
      hold_reason: state.holdReason,
      current_stage: state.currentStage,
      workflow_updated_at: now,
      updated_at: now,
    })
    .eq("id", candidateId);

  if (error) throw error;
}

/* =========================================================
   GET ONE CANDIDATE WORKFLOW
========================================================= */

/** Latest row of a per-candidate table. */
function latestOf(table: string, columns: string, candidateId: string) {
  return supabase
    .from(table)
    .select(columns)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function getCandidateWorkflow(
  candidateId: string,
): Promise<CandidateWorkflowState> {
  const [
    candidateResult,
    medicalResult,
    mofaResult,
    fingerResult,
    policeResult,
    takamulResult,
    visaResult,
    bmetResult,
    flightResult,
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select("id,current_stage,is_returned,final_status")
      .eq("id", candidateId)
      .single(),

    latestOf(
      "medicals",
      "medical_date,fit_date,status,created_at",
      candidateId,
    ),
    latestOf("mofas", "application_date,stage,created_at", candidateId),

    supabase
      .from("fingers")
      .select("status,created_at")
      .eq("candidate_id", candidateId)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    latestOf("police_clearances", "verified,created_at", candidateId),
    latestOf("trade_tests", "result,status,created_at", candidateId),
    latestOf(
      "visas",
      "visa_date,expiry_date,status,created_at",
      candidateId,
    ),
    latestOf("bmet", "bmet,created_at", candidateId),
    latestOf("flights", "flight_date,status,created_at", candidateId),
  ]);

    for (const result of [
    candidateResult,
    medicalResult,
    mofaResult,
    fingerResult,
    policeResult,
    takamulResult,
    visaResult,
    bmetResult,
    flightResult,
  ]) {
    if (result.error) throw result.error;
  }

  const candidate = candidateResult.data;

  if (!candidate) {
    throw new Error(`Candidate not found: ${candidateId}`);
  }

  return calculateWorkflowState(
    buildWorkflowInput(candidate, {
      medical: medicalResult.data as MedicalRow | null,
      mofa: mofaResult.data as MofaRow | null,
      finger: fingerResult.data as FingerRow | null,
      police: policeResult.data as PoliceRow | null,
      takamul: takamulResult.data as TakamulRow | null,
      visa: visaResult.data as VisaRow | null,
      bmet: bmetResult.data as BmetRow | null,
      flight: flightResult.data as FlightRow | null,
    }),
  );
}

/* =========================================================
   SYNC ONE CANDIDATE
========================================================= */

export async function syncCandidateWorkflowState(
  candidateId: string,
): Promise<void> {
  const state = await getCandidateWorkflow(candidateId);
  await saveWorkflowState(candidateId, state);
}

/* =========================================================
   LIVE WORKFLOW STATES (batch, avoids N+1 queries)
   Used by dashboard and candidate list.
========================================================= */

interface CandidateRow {
  candidate_id: string;
  created_at: string;
}

/** Rows must be ordered newest-first; keeps the first row per candidate. */
function latestRowsByCandidate<T extends CandidateRow>(
  rows: T[] | null | undefined,
): Map<string, T> {
  const map = new Map<string, T>();

  for (const row of rows ?? []) {
    if (!map.has(row.candidate_id)) {
      map.set(row.candidate_id, row);
    }
  }

  return map;
}

export async function getLiveWorkflowStates(
  candidates: WorkflowCandidateInput[],
): Promise<Map<string, CandidateWorkflowState>> {
  const states = new Map<string, CandidateWorkflowState>();

  if (candidates.length === 0) return states;

  const ids = candidates.map((candidate) => candidate.id);

  const fetchAll = (table: string, columns: string) =>
    supabase
      .from(table)
      .select(columns)
      .in("candidate_id", ids)
      .order("created_at", { ascending: false });

  const [
    medicalsResult,
    mofasResult,
    fingersResult,
    policeResult,
    takamulsResult,
    visasResult,
    bmetResult,
    flightsResult,
  ] = await Promise.all([
    fetchAll("medicals", "candidate_id,medical_date,fit_date,status,created_at"),
    fetchAll("mofas", "candidate_id,application_date,stage,created_at"),
    supabase
      .from("fingers")
      .select("candidate_id,status,created_at,is_current")
      .in("candidate_id", ids)
      .eq("is_current", true)
      .order("created_at", { ascending: false }),
    fetchAll("police_clearances", "candidate_id,verified,created_at"),
    fetchAll("trade_tests", "candidate_id,result,status,created_at"),
    fetchAll(
      "visas",
      "candidate_id,visa_date,expiry_date,status,created_at",
    ),
    fetchAll("bmet", "candidate_id,bmet,created_at"),
    fetchAll("flights", "candidate_id,flight_date,status,created_at"),
  ]);

  for (const query of [
    medicalsResult,
    mofasResult,
    fingersResult,
    policeResult,
    takamulsResult,
    visasResult,
    bmetResult,
    flightsResult,
  ]) {
    if (query.error) throw query.error;
  }

  const medicals = latestRowsByCandidate(medicalsResult.data as any[]);
  const mofas = latestRowsByCandidate(mofasResult.data as any[]);
  const fingers = latestRowsByCandidate(fingersResult.data as any[]);
  const police = latestRowsByCandidate(policeResult.data as any[]);
  const takamuls = latestRowsByCandidate(takamulsResult.data as any[]);
  const visas = latestRowsByCandidate(visasResult.data as any[]);
  const bmets = latestRowsByCandidate(bmetResult.data as any[]);
  const flights = latestRowsByCandidate(flightsResult.data as any[]);

  for (const candidate of candidates) {
    states.set(
      candidate.id,
      calculateWorkflowState(
        buildWorkflowInput(candidate, {
          medical: medicals.get(candidate.id),
          mofa: mofas.get(candidate.id),
          finger: fingers.get(candidate.id),
          police: police.get(candidate.id),
          takamul: takamuls.get(candidate.id),
          visa: visas.get(candidate.id),
          bmet: bmets.get(candidate.id),
          flight: flights.get(candidate.id),
        }),
      ),
    );
  }

  return states;
}