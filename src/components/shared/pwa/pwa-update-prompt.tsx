import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@/components/shared/toast/toast";

// notun version check korar interval (ms)
const CHECK_INTERVAL = 60 * 1000;

// true korle toast na dekhiye shonge shonge update + reload hobe
const AUTO_UPDATE = false;

export function PwaUpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null;

      // registration hobar shathe shathei ekbar check koro,
      // 60s interval er jonno wait korte hobe na
      registration?.update().catch(() => {});
    },
    onRegisterError(error) {
      console.error("SW registration failed:", error);
    },
  });

  // ---- periodic + tab focus + online detection ----
  useEffect(() => {
    function checkForUpdate() {
      const registration = registrationRef.current;
      if (!registration || !navigator.onLine) return;
      registration.update().catch(() => {});
    }

    const interval = window.setInterval(checkForUpdate, CHECK_INTERVAL);

    function onVisible() {
      if (document.visibilityState === "visible") checkForUpdate();
    }

    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // ---- notun version pele, sathe sathe toast ----
  useEffect(() => {
    if (!needRefresh) return;

    if (AUTO_UPDATE) {
      updateServiceWorker(true);
      return;
    }

    toast.show({
      title: "New version available",
      description: "Update kore latest version e jan.",
      type: "info",
      duration: 0, // nijer thekei chole jabe na
      action: {
        label: "Update",
        onClick: () => {
          setNeedRefresh(false);
          updateServiceWorker(true); // skipWaiting + auto reload
        },
      },
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  // ---- prothom bar offline ready ----
  useEffect(() => {
    if (!offlineReady) return;
    toast.success("App ready", "Ekhon offline eo kaj korbe.");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  return null;
}