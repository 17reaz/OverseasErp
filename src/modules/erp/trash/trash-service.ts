import { supabase } from "@/lib/supabase/client";

import type {
  Candidate,
} from "../candidates/candidate-service";

/* =========================================================
   CHILD DATA SUMMARY
========================================================= */

export interface CandidateChildData {
  files: number;
  fingers: number;
  flights: number;
  medicals: number;
  mofas: number;
  police_clearances: number;
  trade_tests: number;
  visas: number;
  total: number;
}

/* =========================================================
   PERMANENT DELETE RESULT
========================================================= */

export interface PermanentDeleteResult {
  success: boolean;
  warning: boolean;
  childData: CandidateChildData;
  message: string;
}

/* =========================================================
   GET CHILD DATA
   ---------------------------------------------------------
   Checks whether the deleted candidate still has related
   business records.
========================================================= */

export async function getCandidateChildData(
  candidateId: string,
): Promise<CandidateChildData> {
  const [
    files,
    fingers,
    flights,
    medicals,
    mofas,
    policeClearances,
    tradeTests,
    visas,
  ] = await Promise.all([
    supabase
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("fingers")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("flights")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("medicals")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("mofas")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("police_clearances")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("trade_tests")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),

    supabase
      .from("visas")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),
  ]);

  const childData: CandidateChildData = {
    files: files.count ?? 0,
    fingers: fingers.count ?? 0,
    flights: flights.count ?? 0,
    medicals: medicals.count ?? 0,
    mofas: mofas.count ?? 0,
    police_clearances: policeClearances.count ?? 0,
    trade_tests: tradeTests.count ?? 0,
    visas: visas.count ?? 0,
    total: 0,
  };

  childData.total =
    childData.files +
    childData.fingers +
    childData.flights +
    childData.medicals +
    childData.mofas +
    childData.police_clearances +
    childData.trade_tests +
    childData.visas;

  return childData;
}

/* =========================================================
   PERMANENTLY DELETE TRASH CANDIDATE
   ---------------------------------------------------------
   IMPORTANT:
   - Candidate must already be soft deleted.
   - Child records are deleted automatically because the
     database FK uses ON DELETE CASCADE.
   - Call with confirmed = false first to get the warning.
   - Call with confirmed = true after user confirmation.
========================================================= */

export async function permanentlyDeleteCandidate(
  id: string,
  confirmed = false,
): Promise<PermanentDeleteResult> {
  const childData = await getCandidateChildData(id);

  /* -------------------------------------------------------
     FIRST CALL:
     Return warning if child data exists.
  ------------------------------------------------------- */

  if (!confirmed && childData.total > 0) {
    return {
      success: false,
      warning: true,
      childData,
      message:
        "This candidate has related records. Permanent deletion will also remove all related data.",
    };
  }

  /* -------------------------------------------------------
     PERMANENT DELETE
     ------------------------------------------------------- */

  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", id)
    .eq("is_deleted", true);

  if (error) {
    return {
      success: false,
      warning: false,
      childData,
      message: error.message,
    };
  }

  return {
    success: true,
    warning: false,
    childData,
    message:
      "Candidate and all related data were permanently deleted.",
  };
}
