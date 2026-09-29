import {
  db,
//   type SyncOperation,
  type SyncQueueItem,
} from "./index"

export async function addToSyncQueue(
  item: Omit<
    SyncQueueItem,
    "id" | "createdAt" | "attempts" | "lastError"
  >,
) {
  return db.syncQueue.add({
    ...item,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  })
}

export async function getPendingSyncItems() {
  return db.syncQueue
    .orderBy("createdAt")
    .toArray()
}

export async function getPendingSyncCount() {
  return db.syncQueue.count()
}

export async function removeSyncItem(
  id: number,
) {
  await db.syncQueue.delete(id)
}

export async function markSyncItemFailed(
  id: number,
  error: string,
) {
  const item = await db.syncQueue.get(id)

  if (!item) return

  await db.syncQueue.update(id, {
    attempts: item.attempts + 1,
    lastError: error,
  })
}

export async function clearSyncQueue() {
  await db.syncQueue.clear()
}