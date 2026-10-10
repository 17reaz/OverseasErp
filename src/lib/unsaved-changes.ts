import { useEffect, useId } from "react"

/*
 * Global registry of "dirty" forms/screens.
 * Ekta-o dirty thakle hasUnsavedChanges() true dey.
 * PWA silent update ei check kore, dirty thakle reload kore na.
 */

const dirtyKeys = new Set<string>()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function setDirty(key: string, dirty: boolean) {
  const had = dirtyKeys.has(key)

  if (dirty && !had) {
    dirtyKeys.add(key)
    emit()
  } else if (!dirty && had) {
    dirtyKeys.delete(key)
    emit()
  }
}

export function hasUnsavedChanges() {
  return dirtyKeys.size > 0
}

export function subscribeUnsavedChanges(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/*
 * Form/screen e ekbar call koro:
 *
 *   useUnsavedChanges(form.formState.isDirty)
 *
 * Unmount hole (save/cancel er por page chere gele) auto clean hoy.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const id = useId()

  useEffect(() => {
    setDirty(id, isDirty)
  }, [id, isDirty])

  useEffect(() => {
    return () => setDirty(id, false)
  }, [id])
}
