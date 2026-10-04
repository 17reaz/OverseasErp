import { supabase } from "@/lib/supabase/client";
import {
  getCachedCandidates,
  cacheCandidates,
} from "@/lib/db/candidate-cache";
import type { CachedCandidate } from "@/lib/db";
import type { Candidate } from "./candidate-types";
import { CANDIDATE_SELECT } from "./candidate-query";

async function getTenantId(): Promise<string> {
  const { data, error } =
    await supabase.rpc("get_my_tenant_id");

  if (error) throw error;

  if (!data) {
    throw new Error("Tenant not found.");
  }

  return data;
}

async function fetchFromDatabase(
  tenantId: string,
): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("is_deleted", false)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return (data ?? []) as unknown as Candidate[];
}

async function saveToDexie(
  candidates: Candidate[],
) {
  if (!candidates.length) return;

  await cacheCandidates(
    candidates.map((candidate) => ({
      ...candidate,
      cached_at: Date.now(),
    })) as unknown as CachedCandidate[],
  );
}

async function refreshInBackground(
  tenantId: string,
) {
  try {
    const candidates =
      await fetchFromDatabase(tenantId);

    await saveToDexie(candidates);
  } catch (error) {
    console.error(
      "Background candidate refresh failed:",
      error,
    );
  }
}

export async function getCandidatesFromEngine(): Promise<Candidate[]> {
  const tenantId = await getTenantId();

  // ---------------------------------------------
  // 1. Dexie first
  // ---------------------------------------------

  const cached =
    await getCachedCandidates(tenantId);

  // ---------------------------------------------
  // 2. Cache exists
  // ---------------------------------------------

  if (cached.length > 0) {
    // UI-তে cache immediately return হবে
    // তারপর background-এ DB refresh হবে।
    void refreshInBackground(tenantId);

    return cached as unknown as Candidate[];
  }

  // ---------------------------------------------
  // 3. Cache empty
  // ---------------------------------------------

  const candidates =
    await fetchFromDatabase(tenantId);

  // ---------------------------------------------
  // 4. Save DB result to Dexie
  // ---------------------------------------------

  await saveToDexie(candidates);

  // ---------------------------------------------
  // 5. First load → UI
  // ---------------------------------------------

  return candidates;
}