import { supabase } from "@/lib/supabase/client";

import type {
  GlobalSearchCandidate,
  GlobalSearchResult,
} from "./global-search-types";

/* =========================================================
   GLOBAL SEARCH SERVICE
   ---------------------------------------------------------
   Global search এখন Candidate-centric।

   Search করবে:
   - Candidate name
   - Passport number

   Result click করলে:
   /app/candidates/:candidateId

   Future-এ এখানেই অন্য module add করা যাবে:
   - Medical
   - MOFA
   - Visa
   - Flight
   - Agent
========================================================= */

const SEARCH_LIMIT = 20;


/* =========================================================
   SEARCH CANDIDATES
========================================================= */

async function searchCandidates(
  query: string,
): Promise<GlobalSearchCandidate[]> {

  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return [];
  }

  const escapedQuery = cleanQuery
    .replace(/[%_]/g, "\\$&");

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(`
      id,
      sl,
      passport_no,
      name
    `)
    .eq("is_deleted", false)
    .or(
      `name.ilike.%${escapedQuery}%,passport_no.ilike.%${escapedQuery}%`,
    )
    .order("sl", {
      ascending: true,
    })
    .limit(SEARCH_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as GlobalSearchCandidate[];
}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

export async function globalSearch(
  query: string,
): Promise<GlobalSearchResult[]> {

  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return [];
  }

  const candidates =
    await searchCandidates(cleanQuery);

  return candidates.map(
    (candidate): GlobalSearchResult => ({
      id: candidate.id,

      type: "candidate",

      title: candidate.name,

      subtitle:
        candidate.passport_no,

      description:
        candidate.sl !== null
          ? `Candidate #${candidate.sl}`
          : "Candidate",

      route:
        `/app/candidates/${encodeURIComponent(
          candidate.id,
        )}`,

      candidate,
    }),
  );
}