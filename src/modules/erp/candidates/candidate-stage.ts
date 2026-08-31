

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


/* =========================================================
   STAGE DEFINITION
   ---------------------------------------------------------
   Stage-এর metadata.

   value:
     Database-এ যে value store হবে।

   label:
     UI-তে যে নাম দেখাবে।

   module:
     কোন ERP module এই stage control করে।

   order:
     Workflow-এর normal sequence.

   IMPORTANT:
   `order` শুধুমাত্র default workflow ordering-এর জন্য।
   Candidate-এর actual current stage database-এর
   `current_stage` field থেকে আসবে।
========================================================= */

export interface CandidateStageDefinition {

  value: CandidateStage;

  label: string;

  module: string;

  order: number;
}


/* =========================================================
   STAGE REGISTRY
   ---------------------------------------------------------
   সমস্ত candidate stages-এর centralized registry.

   Future-এ নতুন module যোগ করতে হলে এখানে definition
   যোগ করা হবে।

   Example:

   INSURANCE: "insurance"

   তারপর definition add করলেই stage system-এর
   centralized contract update হবে।
========================================================= */

export const CANDIDATE_STAGE_DEFINITIONS:
  readonly CandidateStageDefinition[] = [

  {
    value: CANDIDATE_STAGES.CANDIDATE,
    label: "Candidate",
    module: "candidates",
    order: 0,
  },

  {
    value: CANDIDATE_STAGES.MEDICAL,
    label: "Medical",
    module: "medical",
    order: 1,
  },

  {
    value: CANDIDATE_STAGES.MOFA,
    label: "MOFA",
    module: "mofa",
    order: 2,
  },

  {
    value: CANDIDATE_STAGES.FINGER,
    label: "Finger",
    module: "finger",
    order: 3,
  },

  {
    value: CANDIDATE_STAGES.POLICE_CLEARANCE,
    label: "Police Clearance",
    module: "police_clearance",
    order: 4,
  },

  {
    value: CANDIDATE_STAGES.TAKAMUL,
    label: "Takamul",
    module: "takamul",
    order: 5,
  },

  {
    value: CANDIDATE_STAGES.VISA,
    label: "Visa",
    module: "visa",
    order: 6,
  },

  {
    value: CANDIDATE_STAGES.FLIGHT,
    label: "Flight",
    module: "flight",
    order: 7,
  },

] as const;


/* =========================================================
   STAGE HELPERS
========================================================= */


/* ---------------------------------------------------------
   Get stage definition
--------------------------------------------------------- */

export function getCandidateStageDefinition(
  stage: CandidateStage,
): CandidateStageDefinition | undefined {

  return CANDIDATE_STAGE_DEFINITIONS.find(
    (definition) =>
      definition.value === stage,
  );

}


/* ---------------------------------------------------------
   Get stage label
--------------------------------------------------------- */

export function getCandidateStageLabel(
  stage: CandidateStage | null,
): string {

  if (!stage) {
    return "Pending";
  }

  return (
    getCandidateStageDefinition(stage)?.label ??
    stage
  );

}


/* ---------------------------------------------------------
   Get module name from stage
--------------------------------------------------------- */

export function getCandidateStageModule(
  stage: CandidateStage | null,
): string | null {

  if (!stage) {
    return null;
  }

  return (
    getCandidateStageDefinition(stage)?.module ??
    null
  );

}


/* ---------------------------------------------------------
   Get workflow order
--------------------------------------------------------- */

export function getCandidateStageOrder(
  stage: CandidateStage,
): number {

  return (
    getCandidateStageDefinition(stage)?.order ??
    Number.MAX_SAFE_INTEGER
  );

}


/* =========================================================
   STAGE VALIDATION
   ---------------------------------------------------------
   Runtime data validate করার জন্য।

   Useful যখন Supabase থেকে raw string আসে।
========================================================= */

export function isCandidateStage(
  value: string | null | undefined,
): value is CandidateStage {

  if (!value) {
    return false;
  }

  return CANDIDATE_STAGE_DEFINITIONS.some(
    (definition) =>
      definition.value === value,
  );

}
