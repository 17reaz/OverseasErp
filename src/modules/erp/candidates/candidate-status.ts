

/* =========================================================
   FINAL STATUS
   ---------------------------------------------------------
   Database-এর `candidates.final_status` field-এর contract.

   NULL:
     Candidate এখনও active workflow-এ আছে।

   complete:
     পুরো candidate workflow successfully finished.

   cancelled:
     Workflow বন্ধ করা হয়েছে।
     Candidate data database-এ থাকবে এবং পরে
     reactivate করা যাবে।

   IMPORTANT:
   `active` / `hold` এখানে রাখা যাবে না।
   এগুলো operational/display status।
========================================================= */

export const CANDIDATE_FINAL_STATUS = {

  COMPLETE: "complete",

  CANCELLED: "cancelled",

} as const;


export type CandidateFinalStatus =
  | (typeof CANDIDATE_FINAL_STATUS)[keyof typeof CANDIDATE_FINAL_STATUS]
  | null;


/* =========================================================
   DISPLAY / OVERALL STATUS
   ---------------------------------------------------------
   Frontend-এ Candidate-এর overall অবস্থার representation.

   এই status database-এ সরাসরি store করা হবে না।

   Resolver/module data থেকে derive করবে।
========================================================= */

export const CANDIDATE_DISPLAY_STATUS = {

  ACTIVE: "active",

  HOLD: "hold",

  RETURNED: "returned",

  COMPLETE: "complete",

  CANCELLED: "cancelled",

} as const;


export type CandidateDisplayStatus =
  (typeof CANDIDATE_DISPLAY_STATUS)[keyof typeof CANDIDATE_DISPLAY_STATUS];


/* =========================================================
   STATUS LABELS
   ---------------------------------------------------------
   UI-তে label দেখানোর centralized source.

   Components-এ hard-coded status text না রেখে
   এখান থেকে ব্যবহার করা যাবে।
========================================================= */

export const CANDIDATE_STATUS_LABELS: Record<
  CandidateDisplayStatus,
  string
> = {

  active: "Active",

  hold: "Hold",

  returned: "Returned",

  complete: "Complete",

  cancelled: "Cancelled",

};


/* =========================================================
   STATUS DESCRIPTIONS
   ---------------------------------------------------------
   Tooltip / future details / accessibility-এর জন্য।
========================================================= */

export const CANDIDATE_STATUS_DESCRIPTIONS: Record<
  CandidateDisplayStatus,
  string
> = {

  active:
    "Candidate is currently being processed.",

  hold:
    "Candidate workflow is temporarily on hold.",

  returned:
    "Candidate or passport has been returned.",

  complete:
    "Candidate workflow has been successfully completed.",

  cancelled:
    "Candidate workflow has been cancelled.",

};


/* =========================================================
   FINAL STATUS CHECK
   ---------------------------------------------------------
   কোনো final status সেট আছে কি না।
========================================================= */

export function hasCandidateFinalStatus(
  status: CandidateFinalStatus,
): boolean {

  return status !== null;

}


/* =========================================================
   ACTIVE CHECK
   ---------------------------------------------------------
   Database-level active state.

   NOTE:
   Returned আলাদাভাবে check করা হবে।
   কারণ final_status NULL হলেও candidate returned হতে পারে।
========================================================= */

export function isCandidateFinalActive(
  finalStatus: CandidateFinalStatus,
): boolean {

  return finalStatus === null;

}


/* =========================================================
   FINAL STATUS CHECKS
========================================================= */

export function isCandidateFinalComplete(
  finalStatus: CandidateFinalStatus,
): boolean {

  return finalStatus ===
    CANDIDATE_FINAL_STATUS.COMPLETE;

}


export function isCandidateFinalCancelled(
  finalStatus: CandidateFinalStatus,
): boolean {

  return finalStatus ===
    CANDIDATE_FINAL_STATUS.CANCELLED;

}
