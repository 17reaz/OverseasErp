
/* =========================================================
   CANDIDATE STAGES
   ---------------------------------------------------------
   Candidate workflow-এর global stages-এর single source
   of truth.

   IMPORTANT:

   এখানে শুধুমাত্র GLOBAL STAGE থাকবে।

   Module-এর internal sub-stage এখানে থাকবে না।

   Example:

   Medical
     → slip
     → fit
     → unfit
     → expired

   এগুলো Medical module-এর responsibility.

   Candidate stage শুধু বলবে:

     candidate
     medical
     mofa
     finger
     police_clearence
     takamul
     visa
     flight

   Future-এ নতুন module যোগ করতে হলে এখানে add করবে।
========================================================= */

export const CANDIDATE_STAGES = {

  candidate: "candidate",

  medical: "medical",

  mofa: "mofa",

  finger: "finger",

  police_clearence: "police_clearence",

  takamul: "takamul",

  visa: "visa",

  flight: "flight",

} as const;


/* =========================================================
   CANDIDATE STAGE TYPE
========================================================= */

export type CandidateStage =
  (typeof CANDIDATE_STAGES)[keyof typeof CANDIDATE_STAGES];


/* =========================================================
   STAGE DEFINITION
========================================================= */

export interface CandidateStageDefinition {

  /* Database / internal value */

  value: CandidateStage;


  /* UI display name */

  label: string;


  /* Owning module */

  module: string;
}


/* =========================================================
   STAGE REGISTRY
   ---------------------------------------------------------
   Global stage metadata.

   UI, filter, navigation, resolver ইত্যাদি জায়গায়
   এই registry ব্যবহার করা যাবে।

   এতে আলাদা আলাদা file-এ:

     "medical"
     "mofa"
     "visa"

   hard-code করতে হবে না।
========================================================= */

export const CANDIDATE_STAGE_DEFINITIONS:
  readonly CandidateStageDefinition[] = [

  {
    value: CANDIDATE_STAGES.candidate,
    label: "Candidate",
    module: "candidates",
  },

  {
    value: CANDIDATE_STAGES.medical,
    label: "Medical",
    module: "medical",
  },

  {
    value: CANDIDATE_STAGES.mofa,
    label: "MOFA",
    module: "mofa",
  },

  {
    value: CANDIDATE_STAGES.finger,
    label: "Finger",
    module: "finger",
  },

  {
    value: CANDIDATE_STAGES.police_clearence,
    label: "Police Clearance",
    module: "police_clearence",
  },

  {
    value: CANDIDATE_STAGES.takamul,
    label: "Takamul",
    module: "takamul",
  },

  {
    value: CANDIDATE_STAGES.visa,
    label: "Visa",
    module: "visa",
  },

  {
    value: CANDIDATE_STAGES.flight,
    label: "Flight",
    module: "flight",
  },

] as const;


/* =========================================================
   STAGE HELPERS
========================================================= */

/**
 * Get stage definition by stage value.
 */

export function getCandidateStageDefinition(
  stage: CandidateStage,
): CandidateStageDefinition | undefined {

  return CANDIDATE_STAGE_DEFINITIONS.find(
    (definition) =>
      definition.value === stage,
  );
}


/**
 * Get human-readable stage label.
 */

export function getCandidateStageLabel(
  stage: CandidateStage | null,
): string {

  if (!stage) {
    return "Unknown";
  }

  return (
    getCandidateStageDefinition(stage)
      ?.label ??
    stage
  );
}


/**
 * Check whether a value is a valid Candidate stage.
 *
 * Useful when reading `current_stage` from Supabase,
 * because database data is runtime data and TypeScript
 * cannot guarantee it.
 */

export function isCandidateStage(
  value: string | null,
): value is CandidateStage {

  if (!value) {
    return false;
  }

  return CANDIDATE_STAGE_DEFINITIONS.some(
    (definition) =>
      definition.value === value,
  );
}
