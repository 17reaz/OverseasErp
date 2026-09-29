import {
  getPendingSyncCount,
  getPendingSyncItems,
} from "./sync-queue"

import {
//   getSyncState,
  setSyncState,
} from "./sync-state"

let syncing = false

export async function syncNow() {
  if (syncing) return

  if (!navigator.onLine) {
    setSyncState({
      status: "offline",
    })

    return
  }

  syncing = true

  try {
    const pending =
      await getPendingSyncCount()

    setSyncState({
      status: "syncing",
      pending,
      error: null,
    })

    /*
     * Actual Supabase sync will be added later.
     *
     * For now we only detect pending
     * offline operations.
     */

    const items =
      await getPendingSyncItems()

    if (items.length === 0) {
      setSyncState({
        status: "synced",
        pending: 0,
        lastSyncedAt: Date.now(),
        error: null,
      })

      return
    }

    setSyncState({
      status: "syncing",
      pending: items.length,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Sync failed"

    setSyncState({
      status: "error",
      error: message,
    })
  } finally {
    syncing = false
  }
}
export function startSyncEngine() {
  const handleOnline = () => {
    void syncNow()
  }

  const handleOffline = () => {
    setSyncState({
      status: "offline",
    })
  }

  window.addEventListener(
    "online",
    handleOnline,
  )

  window.addEventListener(
    "offline",
    handleOffline,
  )

  if (navigator.onLine) {
    void syncNow()
  }

  return () => {
    window.removeEventListener(
      "online",
      handleOnline,
    )

    window.removeEventListener(
      "offline",
      handleOffline,
    )
  }
}