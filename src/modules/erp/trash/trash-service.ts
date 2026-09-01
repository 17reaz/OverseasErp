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
   Checks whether the deleted candidate has related
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
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("fingers")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("flights")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("mofas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("police_clearances")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("trade_tests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

    supabase
      .from("visas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "candidate_id",
        candidateId,
      ),

  ]);


  /* =======================================================
     CHECK QUERY ERRORS
  ======================================================= */

  const queryError =
    files.error ??
    fingers.error ??
    flights.error ??
    medicals.error ??
    mofas.error ??
    policeClearances.error ??
    tradeTests.error ??
    visas.error;

  if (queryError) {
    throw new Error(
      queryError.message,
    );
  }


  /* =======================================================
     BUILD CHILD DATA
  ======================================================= */

  const childData: CandidateChildData = {
    files:
      files.count ?? 0,

    fingers:
      fingers.count ?? 0,

    flights:
      flights.count ?? 0,

    medicals:
      medicals.count ?? 0,

    mofas:
      mofas.count ?? 0,

    police_clearances:
      policeClearances.count ?? 0,

    trade_tests:
      tradeTests.count ?? 0,

    visas:
      visas.count ?? 0,

    total: 0,
  };


  /* =======================================================
     TOTAL
  ======================================================= */

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
   - Only is_deleted = true candidates can be deleted.
   - Child records are removed by database FK cascade.
   - This function NEVER deletes an active candidate.
========================================================= */

export async function permanentlyDeleteCandidate(
  id: string,
  confirmed = false,
): Promise<PermanentDeleteResult> {

  try {

    /* =====================================================
       CHECK CHILD DATA
    ===================================================== */

    const childData =
      await getCandidateChildData(
        id,
      );


    /* =====================================================
       WARNING
       -----------------------------------------------------
       If child data exists and user has not confirmed,
       do NOT delete anything.
    ===================================================== */

    if (
      childData.total > 0 &&
      !confirmed
    ) {

      return {
        success: false,
        warning: true,
        childData,
        message:
          "This candidate has related records. Permanent deletion will also remove all related data.",
      };

    }


    /* =====================================================
       PERMANENT DELETE
       -----------------------------------------------------
       Only deleted candidates can be permanently removed.
    ===================================================== */

    const {
      data,
      error,
    } = await supabase
      .from("candidates")
      .delete()
      .eq(
        "id",
        id,
      )
      .eq(
        "is_deleted",
        true,
      )
      .select("id")
      .maybeSingle();


    /* =====================================================
       DELETE ERROR
    ===================================================== */

    if (error) {

      return {
        success: false,
        warning: false,
        childData,
        message: error.message,
      };

    }


    /* =====================================================
       CANDIDATE NOT FOUND
       -----------------------------------------------------
       Prevents reporting success if the candidate was
       not actually deleted.
    ===================================================== */

    if (!data) {

      return {
        success: false,
        warning: false,
        childData,
        message:
          "Candidate was not found in Trash or has already been deleted.",
      };

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    return {
      success: true,
      warning: false,
      childData,
      message:
        "Candidate and all related data were permanently deleted.",
    };

  } catch (error) {

    console.error(
      "Permanent candidate delete failed:",
      error,
    );


    return {
      success: false,
      warning: false,
      childData: {
        files: 0,
        fingers: 0,
        flights: 0,
        medicals: 0,
        mofas: 0,
        police_clearances: 0,
        trade_tests: 0,
        visas: 0,
        total: 0,
      },
      message:
        error instanceof Error
          ? error.message
          : "Failed to permanently delete candidate.",
    };

  }
}
