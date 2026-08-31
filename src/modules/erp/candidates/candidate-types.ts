
import type {
  CandidateDisplayStatus,
  CandidateFinalStatus,
} from "./candidate-status";

import type {
  CandidateStage,
} from "./candidate-stage";


/* =========================================================
   DATABASE CANDIDATE
   ---------------------------------------------------------
   Supabase `candidates` table-এর raw representation.

   IMPORTANT:
   এই interface-টাই Candidate module-এর primary
   Source of Truth data contract.

   এখানে কোনো module-specific sub_stage বা
   derived overall_status রাখা হবে না.
========================================================= */

export interface Candidate {

  id: string;

  tenant_id: string;

  sl: number | null;

  passport_no: string;

  name: string;

  received_date: string | null;

  country: string | null;

  created_by: string | null;

  agent_id: string | null;


  /* -------------------------------------------------------
     GLOBAL WORKFLOW STAGE

     Candidate বর্তমানে কোন module/stage-এ আছে।

     Example:
     candidate
     medical
     mofa
     visa
     flight

     IMPORTANT:
     এটি module-এর internal sub-stage নয়।
  ------------------------------------------------------- */

  current_stage: CandidateStage | null;


  /* -------------------------------------------------------
     RETURN STATE

     Returned = passport/candidate physically returned.

     এটি Cancelled-এর থেকে আলাদা।
  ------------------------------------------------------- */

  is_returned: boolean;

  returned_date: string | null;

  returned_reason: string | null;


  /* -------------------------------------------------------
     FINAL STATE

     null       → active workflow
     complete   → workflow successfully finished
     cancelled  → workflow stopped

     Processing / Hold এখানে রাখা হবে না।
     এগুলো module data থেকে derive হবে।
  ------------------------------------------------------- */

  final_status: CandidateFinalStatus;

  final_reason: string | null;


  /* -------------------------------------------------------
     SOFT DELETE

     Candidate physically delete না করে hidden করা হবে।
     Historical/reference integrity বজায় থাকবে।
  ------------------------------------------------------- */

  is_deleted: boolean;


  /* -------------------------------------------------------
     TIMESTAMPS
  ------------------------------------------------------- */

  created_at: string;

  updated_at: string;
}


/* =========================================================
   LIGHTWEIGHT CANDIDATE REFERENCE
   ---------------------------------------------------------
   Medical / MOFA / Visa / Flight ইত্যাদি module-এর জন্য।

   অন্য module-কে পুরো Candidate object দেওয়ার প্রয়োজন নেই।

   Future:
   - TanStack Query
   - Dexie
   - IndexedDB
   - local reference cache

   এর foundation হিসেবে এই contract ব্যবহার হবে।
========================================================= */

export interface CandidateReference {

  id: string;

  sl: number | null;

  passport_no: string;

  name: string;
}


/* =========================================================
   CANDIDATE LIST ITEM
   ---------------------------------------------------------
   Candidate page/UI-এর জন্য derived read model.

   এটি database row নয়।

   Candidate
      +
   module information
      +
   derived status

   = CandidateListItem
========================================================= */

export interface CandidateListItem
  extends Candidate {

  /* -------------------------------------------------------
     GLOBAL STAGE

     Candidate.current_stage থেকেই আসবে।
     আলাদা database field নয়।
  ------------------------------------------------------- */

  stage: CandidateStage | null;


  /* -------------------------------------------------------
     MODULE SUB-STAGE

     Example:

     Medical → fit
     MOFA    → approved
     Visa    → issued

     এটি Candidate table-এর field নয়।
     Respective module থেকে আসবে।
  ------------------------------------------------------- */

  sub_stage: string | null;


  /* -------------------------------------------------------
     DERIVED OVERALL STATUS

     Database-এ store করা হবে না।

     Resolver এই value তৈরি করবে।

     Example:
     complete
     cancelled
     returned
     active
     hold
  ------------------------------------------------------- */

  overall_status: CandidateDisplayStatus;
}
