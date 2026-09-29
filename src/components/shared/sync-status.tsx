import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Check,
  CloudOff,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react"

import {
  getSyncState,
  subscribeSyncState,
  type SyncState,
} from "@/lib/db/sync-state"

export function SyncStatus() {
  const [state, setState] =
    useState<SyncState>(getSyncState())

  useEffect(() => {
    return subscribeSyncState(setState)
  }, [])

  const icon = {
    idle: RefreshCw,
    syncing: Loader2,
    synced: Check,
    offline: CloudOff,
    error: TriangleAlert,
  }[state.status]

  const Icon = icon

  const label = {
    idle: "Ready",
    syncing: "Syncing",
    synced: "Synced",
    offline: "Offline",
    error: "Sync error",
  }[state.status]

  return (
    <div
      title={label}
      className="flex size-9 items-center justify-center"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.status}
          initial={{
            opacity: 0,
            scale: 0.7,
            rotate: -20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.7,
            rotate: 20,
          }}
          transition={{
            duration: 0.18,
          }}
        >
          <Icon
            className={`size-4 ${
              state.status === "syncing"
                ? "animate-spin"
                : ""
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}