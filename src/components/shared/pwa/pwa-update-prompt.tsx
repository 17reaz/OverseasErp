import { useEffect, useRef } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "@/components/shared/toast/toast"

const CHECK_INTERVAL = 5 * 60 * 1000

// user form likhte thakle auto reload korbo na
function isTyping() {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

export function PwaUpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const toastShownRef = useRef(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration ?? null
      registration?.update().catch(() => {})
    },
    onRegisterError(error) {
      console.error("SW registration failed:", error)
    },
  })

  // ---- background e notun version khuji ----
  useEffect(() => {
    const check = () => {
      if (navigator.onLine) registrationRef.current?.update().catch(() => {})
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") check()
    }

    const id = window.setInterval(check, CHECK_INTERVAL)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", check)

    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", check)
    }
  }, [])

  // ---- file download shesh, toast dekhao (ekbar-i) ----
  useEffect(() => {
    if (!needRefresh || toastShownRef.current) return
    toastShownRef.current = true

    toast.show({
      title: "New version ready",
      description: "Update e press korle ekhoni notun version khulbe.",
      type: "info",
      duration: 0,
      action: {
        label: "Update",
        onClick: () => {
          setNeedRefresh(false)
          void updateServiceWorker(true) // skipWaiting + reload, file already cached
        },
      },
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  // ---- button na chepe app theke bairey gele auto apply ----
  useEffect(() => {
  if (!needRefresh) return
  let hiddenAt = 0

  const onChange = () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now()
      return
    }
    // ফিরে এসেছে: ১০ মিনিটের বেশি বাইরে ছিল আর টাইপ করছে না
    if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000 && !isTyping()) {
      void updateServiceWorker(true)
    }
  }

  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}, [needRefresh, updateServiceWorker])

  return null
}