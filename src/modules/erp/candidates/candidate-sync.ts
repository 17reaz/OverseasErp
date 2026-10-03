import { useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"

import { supabase } from "@/lib/supabase/client"
import { db, type CachedCandidate } from "@/lib/db"
import { useAuth } from "@/modules/auth/components/auth-provider"
import { CANDIDATE_SELECT } from "./candidate-cache-loader"

const PAGE = 1000
const metaKey = (tenantId: string) => `candidates:last:${tenantId}`

async function applyRows(rows: CachedCandidate[]) {
  const gone = rows.filter((r) => r.is_deleted).map((r) => r.id)
  const live = rows.filter((r) => !r.is_deleted)
  if (gone.length) await db.candidates.bulkDelete(gone)
  if (live.length) await db.candidates.bulkPut(live)
}

/** Shudhu last sync er por je row change hoyeche seta ana (soft-delete o handle kore) */
export async function syncCandidates(tenantId: string) {
  const meta = await db.cacheMetadata.get(metaKey(tenantId))
  let since = meta?.updatedAt ?? 0

  for (;;) {
    let q = supabase
      .from("candidates")
      .select(CANDIDATE_SELECT)
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: true })
      .limit(PAGE)

    if (since) q = q.gt("updated_at", new Date(since).toISOString())

    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break

    const rows = (data as unknown as CachedCandidate[]).map((r) => ({
      ...r,
      cached_at: Date.now(),
    }))
    await applyRows(rows)

    since = Date.parse(rows[rows.length - 1].updated_at)
    await db.cacheMetadata.put({ key: metaKey(tenantId), updatedAt: since })

    if (data.length < PAGE) break
  }
}

/** Ekta row-i abar ana (agent join soho), tarpor Dexie te likha */
async function pullOne(id: string) {
  const { data } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (!data) return void db.candidates.delete(id)
  await applyRows([{ ...(data as unknown as CachedCandidate), cached_at: Date.now() }])
}

function subscribe(tenantId: string) {
  const channel = supabase
    .channel(`candidates-live-${tenantId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "candidates", filter: `tenant_id=eq.${tenantId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          void db.candidates.delete((payload.old as { id: string }).id)
          return
        }
        void pullOne((payload.new as { id: string }).id)
      },
    )
    .subscribe()

  return () => void supabase.removeChannel(channel)
}

/** Page e eta ei use korbe: cache theke instantly, tarpor sudhu change gulo */
export function useCandidatesLive() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  // undefined = prothombar Dexie porchhe (ms), tarpor kokhono undefined hobe na
  const candidates = useLiveQuery(
    () =>
      tenantId
        ? db.candidates.where("tenant_id").equals(tenantId).toArray()
        : Promise.resolve([] as CachedCandidate[]),
    [tenantId],
  )

  useEffect(() => {
    if (!tenantId) return

    const resync = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void syncCandidates(tenantId).catch(console.error)
      }
    }

    resync()
    const unsubscribe = subscribe(tenantId)
    window.addEventListener("online", resync)
    document.addEventListener("visibilitychange", resync)

    return () => {
      unsubscribe()
      window.removeEventListener("online", resync)
      document.removeEventListener("visibilitychange", resync)
    }
  }, [tenantId])

  return candidates
}