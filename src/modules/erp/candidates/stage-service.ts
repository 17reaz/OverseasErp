// src/modules/erp/candidates/stage-service.ts
//
// SINGLE SOURCE OF TRUTH for candidate workflow-stage logic.
//
// Replaces (deleted):
//   - candidate-stage.ts   (static linear order + getNextCandidateStage)
//   - stage-engine.ts      (module-completion based computation)
//
// Everything about "which stage is a candidate on, and why" lives
// here now: the pipeline definition, the requested-services gate,
// the computation engine, and the orchestrator that ties a toggle
// change back into `candidates.current_stage`.

import { supabase } from "@/lib/supabase/client";

import type { Candidate } from "./candidate-types";
import { isCandidateActive } from "./candidate-selectors";
import { updateCandidateStage, completeCandidate } from "./candidate-service";

import { fetchModuleStatuses } from "./profile/status-service";
import type { ModuleStatus } from "./profile/types";

/* =========================================================
   PIPELINE
   ---------------------------------------------------------
   Fixed order. "candidate" is the starting placeholder (no
   module behind it — it just means "received, nothing started
   yet"). Every other stage maps 1:1 to a module in
   profile/module-configs.tsx (MODULES) via STAGE_TO_SERVICE_KEY
   below.

   NOTE: BMET is not in this list yet — it needs its own module
   (table + profile UI) before it can join the pipeline between
   "visa" and "flight". Adding it later is: one line here, one
   key in REQUESTED_SERVICE_DEFINITIONS, one entry in
   STAGE_TO_SERVICE_KEY, plus the module itself.
========================================================= */

export const CANDIDATE_STAGE_DEFINITIONS = [
  { value: "candidate", label: "Candidate" },
  { value: "medical", label: "Medical" },
  { value: "mofa", label: "MOFA" },
  { value: "finger", label: "Finger" },
  { value: "police_clearance", label: "Police Clearance" },
  { value: "takamul", label: "Takamul" },
  { value: "visa", label: "Visa" },
  { value: "flight", label: "Flight" },
] as const;

export type CandidateStage = (typeof CANDIDATE_STAGE_DEFINITIONS)[number]["value"];

export function getCandidateStageLabel(stage: CandidateStage | null): string {
  if (!stage) return "Not Started";
  return (
    CANDIDATE_STAGE_DEFINITIONS.find((s) => s.value === stage)?.label ?? stage
  );
}

/* =========================================================
   REQUESTED SERVICES
   ---------------------------------------------------------
   `candidates.requested_services` (jsonb). `true` = this stage
   is part of the candidate's pipeline; `false` = skip it
   entirely (already done elsewhere / not needed for this
   candidate). "candidate" itself has no toggle — it's always
   the implicit starting point.

   `iqama` and `manpower` exist as DB columns/toggles for future
   use but are not yet wired into the pipeline below (no module
   for them yet) — same situation BMET will be in until its
   module is built.
========================================================= */

export const REQUESTED_SERVICE_DEFINITIONS = [
  { key: "mofa", label: "MOFA" },
  { key: "visa", label: "Visa" },
  { key: "iqama", label: "Iqama" },
  { key: "finger", label: "Finger" },
  { key: "flight", label: "Flight" },
  { key: "medical", label: "Medical" },
  { key: "takamul", label: "Takamul" },
  { key: "manpower", label: "Manpower" },
  { key: "police_clearance", label: "Police Clearance" },
] as const;

export type RequestedServiceKey =
  (typeof REQUESTED_SERVICE_DEFINITIONS)[number]["key"];

export type RequestedServices = Record<RequestedServiceKey, boolean>;

/** Only the stages that currently have a real module behind them. */
const STAGE_TO_SERVICE_KEY: Partial<Record<CandidateStage, RequestedServiceKey>> = {
  medical: "medical",
  mofa: "mofa",
  finger: "finger",
  police_clearance: "police_clearance",
  takamul: "takamul",
  visa: "visa",
  flight: "flight",
};

export function getDefaultRequestedServices(): RequestedServices {
  return REQUESTED_SERVICE_DEFINITIONS.reduce((acc, definition) => {
    acc[definition.key] = true;
    return acc;
  }, {} as RequestedServices);
}

function normalizeRequestedServices(
  raw: Partial<Record<string, unknown>> | null | undefined,
): RequestedServices {
  const defaults = getDefaultRequestedServices();
  if (!raw) return defaults;

  const normalized = { ...defaults };
  for (const definition of REQUESTED_SERVICE_DEFINITIONS) {
    const value = raw[definition.key];
    if (typeof value === "boolean") {
      normalized[definition.key] = value;
    }
  }
  return normalized;
}

export async function fetchRequestedServices(
  candidateId: string,
): Promise<RequestedServices> {
  const { data, error } = await supabase
    .from("candidates")
    .select("requested_services")
    .eq("id", candidateId)
    .maybeSingle();

  if (error) throw error;

  return normalizeRequestedServices(
    data?.requested_services as Record<string, unknown> | null | undefined,
  );
}

export async function updateRequestedServices(
  candidateId: string,
  services: RequestedServices,
): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .update({
      requested_services: services,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) throw error;
}

/* =========================================================
   ENGINE
   ---------------------------------------------------------
   Pure functions — no DB access, easy to reason about/test.
========================================================= */

/** Pipeline order, filtered down to what this candidate actually needs. */
export function getActivePipeline(
  requestedServices: RequestedServices,
): CandidateStage[] {
  return CANDIDATE_STAGE_DEFINITIONS.map((s) => s.value).filter((stage) => {
    const key = STAGE_TO_SERVICE_KEY[stage];
    if (!key) return true; // "candidate" — always in the pipeline
    return requestedServices[key] === true;
  });
}

interface ComputedStage {
  currentStage: CandidateStage;
  /** All required (non-skipped) module stages are completed. */
  readyToComplete: boolean;
}

/**
 * First not-completed stage in the active pipeline, in PIPELINE
 * order — regardless of which order the underlying modules were
 * actually worked on (parallel/out-of-order completion is fine).
 */
export function computeCurrentStage(
  activePipeline: CandidateStage[],
  moduleStatuses: Record<string, ModuleStatus>,
): ComputedStage {
  const workStages = activePipeline.filter((s) => s !== "candidate");

  if (workStages.length === 0) {
    return { currentStage: "candidate", readyToComplete: false };
  }

  for (const stage of workStages) {
    const status = moduleStatuses[stage] ?? "not_started";
    if (status !== "completed") {
      return { currentStage: stage, readyToComplete: false };
    }
  }

  // Every required stage is done — stay parked on the last one and
  // signal readiness. Actually marking the candidate "Complete" is
  // still a deliberate, separate staff action (markCandidateComplete).
  return {
    currentStage: workStages[workStages.length - 1],
    readyToComplete: true,
  };
}

/** final_status set OR is_returned — engine must not move the stage. */
export function isStageFrozen(candidate: Candidate): boolean {
  return !isCandidateActive(candidate);
}

/* =========================================================
   ORCHESTRATOR
   ---------------------------------------------------------
   Ties the pieces above into what the UI (Manage Service sheet
   + table stage badge) actually needs.
========================================================= */

export interface StageRowView {
  stage: CandidateStage;
  label: string;
  serviceKey: RequestedServiceKey | null;
  /** Whether this stage is included in the candidate's pipeline. */
  requested: boolean;
  moduleStatus: ModuleStatus | null;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface CandidateStageState {
  frozen: boolean;
  currentStage: CandidateStage;
  readyToComplete: boolean;
  requestedServices: RequestedServices;
  rows: StageRowView[];
}

export async function fetchCandidateStageState(
  candidate: Candidate,
): Promise<CandidateStageState> {
  const [requestedServices, moduleStatuses] = await Promise.all([
    fetchRequestedServices(candidate.id),
    fetchModuleStatuses(candidate.id),
  ]);

  const frozen = isStageFrozen(candidate);
  const activePipeline = getActivePipeline(requestedServices);
  const computed = computeCurrentStage(activePipeline, moduleStatuses);

  // Frozen candidates keep whatever stage they were on when they
  // were cancelled/returned/completed — the engine does not move it.
  const currentStage = frozen
    ? candidate.current_stage ?? "candidate"
    : computed.currentStage;
  const readyToComplete = frozen ? false : computed.readyToComplete;

  const rows: StageRowView[] = CANDIDATE_STAGE_DEFINITIONS.map(
    ({ value, label }) => {
      const serviceKey = STAGE_TO_SERVICE_KEY[value] ?? null;
      const requested = serviceKey ? requestedServices[serviceKey] : true;
      const moduleStatus =
        value === "candidate" ? null : moduleStatuses[value] ?? "not_started";

      return {
        stage: value,
        label,
        serviceKey,
        requested,
        moduleStatus,
        isCompleted: moduleStatus === "completed",
        isCurrent: !readyToComplete && value === currentStage,
      };
    },
  );

  return {
    frozen,
    currentStage,
    readyToComplete,
    requestedServices,
    rows,
  };
}

/**
 * Turns a service on/off, then recomputes and persists
 * `current_stage` in one step — this is the ONLY way the pipeline
 * should be reshaped from the UI (no more manual "Change Stage").
 */
export async function setServiceRequested(
  candidate: Candidate,
  key: RequestedServiceKey,
  value: boolean,
): Promise<CandidateStageState> {
  if (isStageFrozen(candidate)) {
    throw new Error(
      "This candidate's workflow is not active — stage cannot be changed.",
    );
  }

  const current = await fetchRequestedServices(candidate.id);
  const next: RequestedServices = { ...current, [key]: value };
  await updateRequestedServices(candidate.id, next);

  const moduleStatuses = await fetchModuleStatuses(candidate.id);
  const activePipeline = getActivePipeline(next);
  const { currentStage } = computeCurrentStage(activePipeline, moduleStatuses);

  if (currentStage !== candidate.current_stage) {
    await updateCandidateStage(candidate.id, currentStage);
  }

  return fetchCandidateStageState({ ...candidate, current_stage: currentStage });
}

/**
 * Re-syncs `current_stage` after a module record changes elsewhere
 * (e.g. a Medical row is marked "fit"). Not wired into every module
 * yet — call this from a module's save-success handler when that
 * integration happens.
 */
export async function syncCurrentStage(
  candidate: Candidate,
): Promise<CandidateStage> {
  if (isStageFrozen(candidate)) {
    return candidate.current_stage ?? "candidate";
  }

  const [requestedServices, moduleStatuses] = await Promise.all([
    fetchRequestedServices(candidate.id),
    fetchModuleStatuses(candidate.id),
  ]);

  const activePipeline = getActivePipeline(requestedServices);
  const { currentStage } = computeCurrentStage(activePipeline, moduleStatuses);

  if (currentStage !== candidate.current_stage) {
    await updateCandidateStage(candidate.id, currentStage);
  }

  return currentStage;
}

export async function markCandidateComplete(
  candidateId: string,
  reason?: string,
): Promise<void> {
  await completeCandidate(candidateId, reason);
}
