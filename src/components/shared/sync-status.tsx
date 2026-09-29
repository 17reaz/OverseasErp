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
    useState<SyncState>(
      getSyncState(),
    )

  useEffect(() => {
    return subscribeSyncState(setState)
  }, [])

  const config = {
    idle: {
      label: "Ready",
      icon: RefreshCw,
    },
    syncing: {
      label: "Syncing",
      icon: Loader2,
    },
    synced: {
      label: "Synced",
      icon: Check,
    },
    offline: {
      label: "Offline",
      icon: CloudOff,
    },
    error: {
      label: "Sync error",
      icon: TriangleAlert,
    },
  }[state.status]

  const Icon = config.icon

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
    >
      <motion.div
        key={`${state.status}-${state.pending}`}
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 4,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.92,
          y: -4,
        }}
        transition={{
          duration: 0.18,
        }}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground"
      >
        <Icon
          className={
            state.status === "syncing"
              ? "size-3.5 animate-spin"
              : "size-3.5"
          }
        />

        <span>
          {config.label}
        </span>

        {state.pending > 0 && (
          <motion.span
            initial={{
              scale: 0.7,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            className="font-medium"
          >
            {state.pending}
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}