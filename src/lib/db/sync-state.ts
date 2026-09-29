export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "offline"
  | "error"

export interface SyncState {
  status: SyncStatus
  pending: number
  lastSyncedAt: number | null
  error: string | null
}

const listeners = new Set<
  (state: SyncState) => void
>()

let state: SyncState = {
  status: navigator.onLine
    ? "idle"
    : "offline",
  pending: 0,
  lastSyncedAt: null,
  error: null,
}

function emit() {
  for (const listener of listeners) {
    listener(state)
  }
}

export function getSyncState() {
  return state
}

export function subscribeSyncState(
  listener: (state: SyncState) => void,
) {
  listeners.add(listener)

  listener(state)

  return () => {
    listeners.delete(listener)
  }
}

export function setSyncState(
  next: Partial<SyncState>,
) {
  state = {
    ...state,
    ...next,
  }

  emit()
}

window.addEventListener(
  "online",
  () => {
    setSyncState({
      status: "idle",
      error: null,
    })
  },
)

window.addEventListener(
  "offline",
  () => {
    setSyncState({
      status: "offline",
    })
  },
)