import { useEffect, useRef } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "@/components/shared/toast/toast"

const CHECK_INTERVAL = 5 * 60 * 1000

export function PwaUpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const toastShownRef = useRef(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration ?? null

      // Initial registration er por ekbar update check.
      // Eta app reload kore na.
      registration?.update().catch(() => {})
    },

    onRegisterError(error) {
      console.error("SW registration failed:", error)
    },
  })

  // ---------------------------------------------------------
  // Background update check
  // ---------------------------------------------------------
  useEffect(() => {
    const checkForUpdate = () => {
      if (!navigator.onLine) return

      registrationRef.current?.update().catch(() => {})
    }

    // Background e periodically new deployment check korbe
    const intervalId = window.setInterval(
      checkForUpdate,
      CHECK_INTERVAL,
    )

    // Internet abar ashle update check korbe
    window.addEventListener("online", checkForUpdate)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("online", checkForUpdate)
    }
  }, [])

  // ---------------------------------------------------------
  // New version ready -> show toast
  // ---------------------------------------------------------
  useEffect(() => {
    if (!needRefresh || toastShownRef.current) return

    toastShownRef.current = true

    toast.show({
      title: "New version ready",
      description:
        "Notun version ready. Update press korle ekhoni apply hobe.",
      type: "info",
      duration: 0,
      action: {
        label: "Update",
        onClick: () => {
          setNeedRefresh(false)

          // User manually update korle:
          // skipWaiting + page reload
          void updateServiceWorker(true)
        },
      },
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  // ---------------------------------------------------------
  // IMPORTANT:
  // visibilitychange / inactive -> active
  // ekhane kono updateServiceWorker(true) nei.
  //
  // Tai:
  // app minimize korle
  // tab change korle
  // phone lock/unlock korle
  // PWA theke baire giye abar ashle
  //
  // automatically reload hobe na.
  // ---------------------------------------------------------

  return null
}