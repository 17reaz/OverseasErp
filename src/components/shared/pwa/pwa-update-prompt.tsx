import { useEffect, useRef } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "@/components/shared/toast/toast"
import {
  hasUnsavedChanges,
  subscribeUnsavedChanges,
} from "@/lib/unsaved-changes"

const CHECK_INTERVAL = 5 * 60 * 1000

export function PwaUpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const toastShownRef = useRef(false)
  const applyingRef = useRef(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration ?? null

      // Notun version thakle browser nijei background e
      // download + precache kore rakhe. UI te kichu dekhay na.
      registration?.update().catch(() => {})
    },

    onRegisterError(error) {
      console.error("SW registration failed:", error)
    },
  })

  // ---------------------------------------------------------
  // Update apply korar single entry point
  // ---------------------------------------------------------
  const applyUpdate = () => {
    if (applyingRef.current) return

    applyingRef.current = true
    setNeedRefresh(false)

    // skipWaiting + reload (already download kora, tai instant)
    void updateServiceWorker(true)
  }

  // Page hidden + kono unsaved change nei hole-i silently apply
  const tryApplySilently = () => {
    if (document.visibilityState !== "hidden") return
    if (hasUnsavedChanges()) return

    applyUpdate()
  }

  const showUpdateToast = () => {
    if (toastShownRef.current) return

    toastShownRef.current = true

    toast.show({
      title: "New version ready",
      description:
        "Notun version ready. Update press korle ekhoni apply hobe.",
      type: "info",
      duration: 0,
      action: {
        label: "Update",
        // User nijer icche te press korle shorashori apply
        onClick: applyUpdate,
      },
    })
  }

  // ---------------------------------------------------------
  // Silent background update check
  // ---------------------------------------------------------
  useEffect(() => {
    const checkForUpdate = () => {
      if (!navigator.onLine) return

      registrationRef.current?.update().catch(() => {})
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate()
      }
    }

    const intervalId = window.setInterval(
      checkForUpdate,
      CHECK_INTERVAL,
    )

    window.addEventListener("online", checkForUpdate)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("online", checkForUpdate)
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      )
    }
  }, [])

  // ---------------------------------------------------------
  // Update ready thakle:
  //
  // - hidden + clean   -> silently apply
  // - hidden + dirty   -> apply kora hobe na, wait kore
  // - visible          -> toast dekhabe
  //
  // Dirty form clean hole (save korle) ar page hidden thakle
  // tokhon apply hobe.
  // ---------------------------------------------------------
  useEffect(() => {
    if (!needRefresh) return

    if (document.visibilityState === "visible") {
      showUpdateToast()
    } else {
      tryApplySilently()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        tryApplySilently()
      } else {
        // dirty chhilo bole apply hoyni, ekhon user fire eshese
        showUpdateToast()
      }
    }

    const unsubscribe = subscribeUnsavedChanges(tryApplySilently)

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      unsubscribe()
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh])

  return null
}
