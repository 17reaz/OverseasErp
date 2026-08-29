import { supabase } from "@/lib/supabase/client"

import { MODULES } from "./profile/module-configs"
import { fetchModuleStatuses } from "./profile/status-service"
import type { ModuleStatus } from "./profile/types"


/* =========================================================
 * UNIVERSAL STAGE ENGINE
 * ---------------------------------------------------------
 * Lightweight, pipeline-order based way to keep the
 * `candidates.current_stage` column roughly in sync with
 * real progress — this is NOT the full workflow engine
 * (that's a separate, bigger piece for later). For now it's
 * just a column, computed and written here.
 *
 * Rule: current stage = the title of the first module (in
 * the order MODULES is defined in) that is not "completed"
 * yet. This naturally handles a candidate who already has a
 * later stage done out of order — the stage correctly stays
 * "stuck" at the earliest real gap, which is what actually
 * needs attention.
 *
 * - Every module completed        -> "Completed"
 * - Nothing touched yet at all    -> "Pending"
 * - Otherwise                     -> title of the first
 *                                     incomplete module
 *
 * Nothing here is hardcoded to a specific module — adding a
 * new module to MODULES is enough for it to be picked up by
 * this calculation automatically.
 * ========================================================= */

export function computeCurrentStage(
  moduleStatuses: Record<string, ModuleStatus>,
): string {
  const nothingStarted = MODULES.every(
    (module) => (moduleStatuses[module.key] ?? "not_started") === "not_started",
  )

  if (nothingStarted) {
    return "Pending"
  }

  const firstIncomplete = MODULES.find(
    (module) => (moduleStatuses[module.key] ?? "not_started") !== "completed",
  )

  return firstIncomplete ? firstIncomplete.title : "Completed"
}

/**
 * Pulls fresh module statuses for a candidate and computes
 * what their current stage *should* be right now, without
 * writing anything.
 */
export async function retrieveCurrentStage(
  candidateId: string,
): Promise<string> {
  const statuses = await fetchModuleStatuses(candidateId)
  return computeCurrentStage(statuses)
}

/**
 * Retrieves + writes the computed stage back onto the
 * candidate row. Returns the new stage, or null if the
 * write failed.
 */
export async function syncCurrentStage(
  candidateId: string,
): Promise<string | null> {
  const stage = await retrieveCurrentStage(candidateId)

  const { error } = await supabase
    .from("candidates")
    .update({
      current_stage: stage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId)

  if (error) {
    console.error("Failed to sync current_stage", error)
    return null
  }

  return stage
}
