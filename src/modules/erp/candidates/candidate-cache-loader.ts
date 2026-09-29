import { supabase } from "@/lib/supabase/client"
import {
  cacheCandidates,
  getCachedCandidates,
} from "@/lib/db/candidate-cache"
import type { Candidate } from "./candidate-types"

const CANDIDATE_SELECT = `
  id,
  tenant_id,
  sl,
  passport_no,
  name,
  received_date,
  country,
  created_by,
  agent_id,
  agent:agents (
    id,
    name,
    code
  ),
  current_stage,
  workflow_state,
  hold_reason,
  workflow_updated_at,
  is_returned,
  returned_date,
  returned_reason,
  final_status,
  final_reason,
  is_deleted,
  created_at,
  updated_at
`

export async function getCachedCandidatesFirst(): Promise<Candidate[]> {
  const {
    data: tenantId,
    error: tenantError,
  } = await supabase.rpc("get_my_tenant_id")

  if (tenantError || !tenantId) {
    return []
  }

  const cached =
    await getCachedCandidates(tenantId)

  if (cached.length > 0) {
    return cached as Candidate[]
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("candidates")
      .select(CANDIDATE_SELECT)
      .eq("is_deleted", false)
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      throw error
    }

    const candidates =
      (data ?? []) as unknown as Candidate[]

    await cacheCandidates(
      candidates.map((candidate) => ({
        ...candidate,
        cached_at: Date.now(),
      })),
    )

    return candidates
  } catch (error) {
    console.error(
      "Failed to load candidates:",
      error,
    )

    return []
  }
}
export async function refreshCandidatesCache(): Promise<Candidate[]> {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT)
    .eq("is_deleted", false)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    throw error
  }

  const candidates =
    (data ?? []) as unknown as Candidate[]

  await cacheCandidates(
    candidates.map((candidate) => ({
      ...candidate,
      cached_at: Date.now(),
    })),
  )

  return candidates
}