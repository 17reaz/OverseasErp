
import type {
  Candidate,
} from "./candidate-types";

import {
  CANDIDATE_DISPLAY_STATUS,
  CANDIDATE_FINAL_STATUS,
  type CandidateDisplayStatus,
} from "./candidate-status";


/* =========================================================
   MODULE STATUS
   ---------------------------------------------------------
   Future module থেকে Candidate overall status derive করার
   জন্য common contract.

   এখন Candidate module নিজে moduleStatus পাঠাবে না।

   Future:

   Medical  → processing / hold
   MOFA     → processing / hold
   Visa     → processing / hold
   Flight   → processing / hold

   এই data পরে এই resolver-এ আসবে।
========================================================= */

export type CandidateModuleStatus =
  | "processing"
  | "hold"
  | null;


/* =========================================================
   OVERALL STATUS CONTEXT
   ---------------------------------------------------------
   Candidate state + module state.

   এখন moduleStatus optional রাখা হয়েছে যাতে existing
   Candidate module ভাঙে না।

   Future module integration এখান থেকেই হবে।
========================================================= */

export interface CandidateOverallStatusContext {

  moduleStatus?: CandidateModuleStatus;

}


/* =========================================================
   OVERALL STATUS
   ---------------------------------------------------------
   Candidate-এর final/display status derive করে।

   PRIORITY:

   1. Complete
   2. Cancelled
   3. Returned
   4. Hold
   5. Processing / Active

   IMPORTANT:

   `overall_status` database-এ store করা হবে না।

   এটি সবসময় current Candidate + module state থেকে
   derive করা হবে।
========================================================= */

export function getCandidateOverallStatus(
  candidate: Candidate,
  context: CandidateOverallStatusContext = {},
): CandidateDisplayStatus {

  /* -------------------------------------------------------
     1. COMPLETE

     Complete হলে আর module status matter করবে না।
  ------------------------------------------------------- */

  if (
    candidate.final_status ===
    CANDIDATE_FINAL_STATUS.COMPLETE
  ) {

    return CANDIDATE_DISPLAY_STATUS.COMPLETE;

  }


  /* -------------------------------------------------------
     2. CANCELLED

     Cancelled হলে workflow stopped.

     Future-এ reactivate করলে final_status আবার NULL হবে।
  ------------------------------------------------------- */

  if (
    candidate.final_status ===
    CANDIDATE_FINAL_STATUS.CANCELLED
  ) {

    return CANDIDATE_DISPLAY_STATUS.CANCELLED;

  }


  /* -------------------------------------------------------
     3. RETURNED

     Returned আলাদা business state।

     এটি cancelled নয়।
  ------------------------------------------------------- */

  if (
    candidate.is_returned
  ) {

    return CANDIDATE_DISPLAY_STATUS.RETURNED;

  }


  /* -------------------------------------------------------
     4. HOLD

     Module থেকে hold এলে overall candidate hold হবে।

     Example:

     current_stage = medical
     medical.status = expired

     → overall = hold
  ------------------------------------------------------- */

  if (
    context.moduleStatus === "hold"
  ) {

    return CANDIDATE_DISPLAY_STATUS.HOLD;

  }


  /* -------------------------------------------------------
     5. PROCESSING

     Module explicitly processing হলে active।

     UI-তে এখন `Active` display করা হচ্ছে।

     Future চাইলে আলাদা `processing` display status
     যোগ করা যাবে, কিন্তু এখন database contract
     পরিবর্তন করছি না।
  ------------------------------------------------------- */

  if (
    context.moduleStatus === "processing"
  ) {

    return CANDIDATE_DISPLAY_STATUS.ACTIVE;

  }


  /* -------------------------------------------------------
     6. DEFAULT ACTIVE

     final_status = NULL
     is_returned = false

     → Active
  ------------------------------------------------------- */

  return CANDIDATE_DISPLAY_STATUS.ACTIVE;

}


/* =========================================================
   DATABASE STATE HELPERS
========================================================= */


/* ---------------------------------------------------------
   IS ACTIVE

   Active এখানে final database state বোঝাচ্ছে।

   অর্থাৎ:
     final_status = NULL
     is_returned = false
--------------------------------------------------------- */

export function isCandidateActive(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status === null &&
    candidate.is_returned === false
  );

}


/* ---------------------------------------------------------
   IS RETURNED
--------------------------------------------------------- */

export function isCandidateReturned(
  candidate: Candidate,
): boolean {

  return candidate.is_returned === true;

}


/* ---------------------------------------------------------
   IS COMPLETE
--------------------------------------------------------- */

export function isCandidateComplete(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status ===
    CANDIDATE_FINAL_STATUS.COMPLETE
  );

}


/* ---------------------------------------------------------
   IS CANCELLED
--------------------------------------------------------- */

export function isCandidateCancelled(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status ===
    CANDIDATE_FINAL_STATUS.CANCELLED
  );

}


/* =========================================================
   FINAL STATE CHECK
   ---------------------------------------------------------
   Candidate workflow permanently/explicitly finished
   বা stopped কি না।
========================================================= */

export function isCandidateFinalized(
  candidate: Candidate,
): boolean {

  return (
    candidate.final_status !== null
  );

}


/* =========================================================
   CAN REACTIVATE
   ---------------------------------------------------------
   Cancelled candidate আবার active করা যাবে।

   Returned candidate-ও restore করা যাবে।

   Complete candidate সাধারণত reactivation-এর জন্য
   allowed নয়।

   Business rule future-এ আরও strict করা যাবে।
========================================================= */

export function canReactivateCandidate(
  candidate: Candidate,
): boolean {

  if (
    isCandidateComplete(candidate)
  ) {

    return false;

  }


  if (
    isCandidateCancelled(candidate)
  ) {

    return true;

  }


  if (
    isCandidateReturned(candidate)
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   CAN EDIT
   ---------------------------------------------------------
   Complete candidate historical state হিসেবে treat করা
   যায়।

   Cancelled / Returned candidate-এর edit behaviour
   application layer থেকে control করা যাবে।
========================================================= */

export function canEditCandidate(
  candidate: Candidate,
): boolean {

  return !isCandidateComplete(candidate);

}
