
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
   এই interface-টাই Candidate Source of Truth-এর
   primary frontend data contract.

   Database column-এর নাম এখানে 그대로 রাখা হয়েছে।
========================================================= */

export interface Candidate {

  /* -------------------------------------------------------
     IDENTITY
  ------------------------------------------------------- */

  id: string;

  tenant_id: string;

  sl: number | null;


  /* -------------------------------------------------------
     CANDIDATE BASIC DATA
  ------------------------------------------------------- */

  passport_no: string;

  name: string;

  received_date: string | null;

  country: string | null;


  /* -------------------------------------------------------
     OWNERSHIP / RELATION
  ------------------------------------------------------- */

  created_by: string | null;

  agent_id: string | null;


  /* -------------------------------------------------------
     WORKFLOW / STAGE
     -------------------------------------------------------

     current_stage এখন database-এর existing column.

     Future-এ stage architecture পরিবর্তন হলেও
     এই field সরাসরি delete করা হবে না।

     Migration-safe approach:
     current_stage
          ↓
     Candidate stage resolver
          ↓
     module-specific stage
  ------------------------------------------------------- */

  current_stage: CandidateStage | string | null;


  /* -------------------------------------------------------
     RETURN STATE
     -------------------------------------------------------

     Returned ≠ Cancelled

     is_returned:
     candidate/passport physically returned.

     returned_reason:
     কেন returned হয়েছে।
  ------------------------------------------------------- */

  is_returned: boolean;

  returned_date: string | null;

  returned_reason: string | null;


  /* -------------------------------------------------------
     FINAL WORKFLOW STATE
     -------------------------------------------------------

     final_status:

       null       → Active
       complete   → Completed
       cancelled  → Cancelled

     Processing / Hold এখানে permanently store হবে না.

     এগুলো future module data থেকে derive হবে।
  ------------------------------------------------------- */

  final_status: CandidateFinalStatus;

  final_reason: string | null;


  /* -------------------------------------------------------
     SOFT DELETE
  ------------------------------------------------------- */

  is_deleted: boolean;


  /* -------------------------------------------------------
     AUDIT
  ------------------------------------------------------- */

  created_at: string;

  updated_at: string;
}


/* =========================================================
   LIGHTWEIGHT CANDIDATE REFERENCE
   ---------------------------------------------------------
   অন্য module যখন শুধু Candidate identify করতে চায়,
   তখন পুরো Candidate object fetch করার প্রয়োজন নেই।

   Example:

   Medical
   MOFA
   Visa
   Flight

   এগুলো CandidateReference ব্যবহার করতে পারবে
   যেখানে full candidate data প্রয়োজন নেই।

   Future:
   - TanStack Query
   - IndexedDB
   - Dexie
   - local cache
========================================================= */

export interface CandidateReference {

  id: string;

  sl: number | null;

  passport_no: string;

  name: string;
}


/* =========================================================
   CANDIDATE LIST / READ MODEL
   ---------------------------------------------------------
   Candidate page-এর frontend-friendly representation.

   IMPORTANT:
   এই fields database-এর source columns নয়।

   এগুলো application/read-model layer থেকে derive হবে।
========================================================= */

export interface CandidateListItem
  extends Candidate {

  /* -------------------------------------------------------
     DISPLAY STAGE

     Database-এর current_stage থেকে normalize করা হতে পারে।
  ------------------------------------------------------- */

  stage: CandidateStage | null;


  /* -------------------------------------------------------
     MODULE SUB-STAGE

     Example:

     Medical:
       slip
       fit
       unfit

     MOFA:
       submitted
       approved
       expired

     Visa:
       applied
       issued
       rejected

     এগুলো Candidate table-এর fixed enum নয়।
     Module নিজে control করবে।
  ------------------------------------------------------- */

  sub_stage: string | null;


  /* -------------------------------------------------------
     DISPLAY OVERALL STATUS

     Database column নয়।

     Resolver:

       final_status
       is_returned
       module data

       ↓

       overall_status
  ------------------------------------------------------- */

  overall_status: CandidateDisplayStatus;
}
