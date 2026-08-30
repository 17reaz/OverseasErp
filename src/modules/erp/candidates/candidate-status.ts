// src/modules/erp/candidates/candidate-status.ts

/* =========================================================
   DATABASE FINAL STATUS
   ---------------------------------------------------------
   NULL      = candidate is active
   complete  = workflow successfully completed
   cancelled = workflow stopped but can be reactivated
========================================================= */

export const CANDIDATE_FINAL_STATUS = {
  COMPLETE: "complete",
  CANCELLED: "cancelled",
} as const;

export type CandidateFinalStatus =
  | (typeof CANDIDATE_FINAL_STATUS)[keyof typeof CANDIDATE_FINAL_STATUS]
  | null;


/* =========================================================
   DISPLAY STATUS
   ---------------------------------------------------------
   Frontend-এর জন্য derived status.

   Processing / Hold database-এ আলাদা করে store হবে না।
   Module data থেকে future-এ derive হবে।
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