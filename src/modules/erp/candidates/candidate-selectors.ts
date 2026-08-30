// src/modules/erp/candidates/candidate-selectors.ts

import type { Candidate } from "./candidate-types";
import {
  CANDIDATE_DISPLAY_STATUS,
  type CandidateDisplayStatus,
} from "./candidate-status";


/* =========================================================
   OVERALL STATUS
   ---------------------------------------------------------
   Priority:

   1. Complete
   2. Cancelled
   3. Returned
   4. Active

   Active-এর ভিতরের Processing / Hold
   ভবিষ্যতে module data থেকে derive হবে.
========================================================= */

export function getCandidateOverallStatus(
  candidate: Candidate,
): CandidateDisplayStatus {

  if (
    candidate.final_status === "complete"
  ) {
    return CANDIDATE_DISPLAY_STATUS.COMPLETE;
  }


  if (
    candidate.final_status === "cancelled"
  ) {
    return CANDIDATE_DISPLAY_STATUS.CANCELLED;
  }


  if (
    candidate.is_returned
  ) {
    return CANDIDATE_DISPLAY_STATUS.RETURNED;
  }


  return CANDIDATE_DISPLAY_STATUS.ACTIVE;
}


/* =========================================================
   ACTIVE
========================================================= */

export function isCandidateActive(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status === null &&
    candidate.is_returned === false
  );
}


/* =========================================================
   RETURNED
========================================================= */

export function isCandidateReturned(
  candidate: Candidate,
): boolean {

  return candidate.is_returned === true;
}


/* =========================================================
   COMPLETE
========================================================= */

export function isCandidateComplete(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status === "complete"
  );
}


/* =========================================================
   CANCELLED
========================================================= */

export function isCandidateCancelled(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status === "cancelled"
  );
}