/* =========================================================
   CANDIDATE STAGES
   ---------------------------------------------------------
   Candidate বর্তমানে কোন workflow module-এ আছে,
   তার centralized source of truth.

   IMPORTANT:
   এখানে শুধুমাত্র GLOBAL STAGE থাকবে।

   Module-এর internal sub-stage এখানে থাকবে না.

   Example:

   Candidate Stage:
     medical

   Medical Sub-stage:
     new / slip / fit / unfit / expired

   এই দুইটা আলাদা responsibility.
========================================================= */

export const CANDIDATE_STAGES = {
  CANDIDATE: "candidate",
  MEDICAL: "medical",
  MOFA: "mofa",
  FINGER: "finger",
  POLICE_CLEARANCE: "police_clearance",
  TAKAMUL: "takamul",
  VISA: "visa",
  FLIGHT: "flight",
} as const;

export type CandidateStage =
  (typeof CANDIDATE_STAGES)[keyof typeof CANDIDATE_STAGES];

export interface CandidateStageDefinition {
  value: CandidateStage;
  label: string;
  module: string;
  order: number;
}

export const CANDIDATE_STAGE_DEFINITIONS:
  readonly CandidateStageDefinition[] = [
  { value: CANDIDATE_STAGES.CANDIDATE, label: "Candidate", module: "candidates", order: 0 },
  { value: CANDIDATE_STAGES.MEDICAL, label: "Medical", module: "medical", order: 1 },
  { value: CANDIDATE_STAGES.MOFA, label: "MOFA", module: "mofa", order: 2 },
  { value: CANDIDATE_STAGES.FINGER, label: "Finger", module: "finger", order: 3 },
  { value: CANDIDATE_STAGES.POLICE_CLEARANCE, label: "Police Clearance", module: "police_clearance", order: 4 },
  { value: CANDIDATE_STAGES.TAKAMUL, label: "Takamul", module: "takamul", order: 5 },
  { value: CANDIDATE_STAGES.VISA, label: "Visa", module: "visa", order: 6 },
  { value: CANDIDATE_STAGES.FLIGHT, label: "Flight", module: "flight", order: 7 },
] as const;

export function getCandidateStageDefinition(
  stage: CandidateStage,
): CandidateStageDefinition | undefined {
  return CANDIDATE_STAGE_DEFINITIONS.find(
    (definition) => definition.value === stage,
  );
}

export function getCandidateStageLabel(
  stage: CandidateStage | null,
): string {
  if (!stage) return "Pending";
  return getCandidateStageDefinition(stage)?.label ?? stage;
}

export function getCandidateStageModule(
  stage: CandidateStage | null,
): string | null {
  if (!stage) return null;
  return getCandidateStageDefinition(stage)?.module ?? null;
}

export function getCandidateStageOrder(
  stage: CandidateStage,
): number {
  return getCandidateStageDefinition(stage)?.order ?? Number.MAX_SAFE_INTEGER;
}

/* ---------------------------------------------------------
   NEW: Get next stage in the workflow
   ---------------------------------------------------------
   Global "Next" button এর জন্য। `order` অনুযায়ী পরের stage
   কী সেটা বলে দেয়। null মানে workflow-এর শেষ (FLIGHT) —
   candidate complete করার সময় হয়েছে। currentStage null
   হলে (নতুন candidate) প্রথম stage (CANDIDATE) রিটার্ন করে।
--------------------------------------------------------- */

export function getNextCandidateStage(
  currentStage: CandidateStage | null,
): CandidateStage | null {
  if (!currentStage) {
    return CANDIDATE_STAGES.CANDIDATE;
  }

  const currentOrder = getCandidateStageOrder(currentStage);

  const next = CANDIDATE_STAGE_DEFINITIONS
    .filter((definition) => definition.order > currentOrder)
    .sort((a, b) => a.order - b.order)[0];

  return next ? next.value : null;
}

/* ---------------------------------------------------------
   NEW: Is last stage
--------------------------------------------------------- */

export function isLastCandidateStage(
  stage: CandidateStage | null,
): boolean {
  if (!stage) return false;
  return getNextCandidateStage(stage) === null;
}

export function isCandidateStage(
  value: string | null | undefined,
): value is CandidateStage {
  if (!value) return false;
  return CANDIDATE_STAGE_DEFINITIONS.some(
    (definition) => definition.value === value,
  );
}