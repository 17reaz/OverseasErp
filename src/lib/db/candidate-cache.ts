import { db, type CachedCandidate } from "./index"

export async function cacheCandidates(
  candidates: CachedCandidate[],
) {
  if (!candidates.length) return

  await db.candidates.bulkPut(candidates)
}

export async function getCachedCandidates(
  tenantId: string,
) {
  return db.candidates
    .where("tenant_id")
    .equals(tenantId)
    .toArray()
}

export async function clearCandidateCache(
  tenantId: string,
) {
  await db.candidates
    .where("tenant_id")
    .equals(tenantId)
    .delete()
}
export async function updateCachedCandidate(
  candidate: CachedCandidate,
) {
  await db.candidates.put(candidate)
}