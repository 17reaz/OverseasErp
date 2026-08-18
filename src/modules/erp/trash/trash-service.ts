import { supabase } from "@/lib/supabase/client";

import type {
  Candidate,
} from "../candidates/candidate-service";


// =====================================================
// GET DELETED CANDIDATES
// =====================================================

export async function getDeletedCandidates() {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(`
      *,
      agent:agents (
        id,
        name,
        code
      )
    `)
    .eq(
      "is_deleted",
      true,
    )
    .order(
      "sl",
      {
        ascending: false,
      },
    );

  return {
    data:
      data as Candidate[] | null,

    error,
  };
}


// =====================================================
// RESTORE DELETED CANDIDATE
// =====================================================

export async function restoreDeletedCandidate(
  id: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .update({
      is_deleted: false,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      id,
    )
    .eq(
      "is_deleted",
      true,
    )
    .select(`
      *,
      agent:agents (
        id,
        name,
        code
      )
    `)
    .single();

  return {
    data:
      data as Candidate | null,

    error,
  };
}