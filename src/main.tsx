import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./app/App";
import { AppErrorBoundary } from "./components/error-boundary";
import { TooltipProvider } from "./components/ui/tooltip";
import { queryClient } from "./lib/tanstack/query-client";

import "./index.css";

const RELOAD_KEY = "oerp-chunk-reload-at";
const RELOAD_COOLDOWN_MS = 30_000;

/**
 * After a new deploy, old chunks may 404. Reload once to pick up the new build,
 * with a cooldown so a real failure can't cause a reload loop.
 */
function setupChunkReloadRecovery() {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    console.error(
      "[OverseasErp] Dynamic import failed:",
      (event as Event & { payload?: unknown }).payload,
    );

    try {
      const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);

      if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) {
        console.error("[OverseasErp] Reload skipped: cooldown active.");
        return;
      }

      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // sessionStorage unavailable; reload once anyway.
    }

    window.location.reload();
  });
}

/** Dev-only page lifecycle logging, useful for debugging unexpected reloads. */
function setupLifecycleLogging() {
  if (!import.meta.env.DEV) return;

  const now = () => new Date().toISOString();
  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;

  console.info("[OERP lifecycle] document started", {
    time: now(),
    navigationType: navigation?.type,
    visibility: document.visibilityState,
  });

  window.addEventListener("pageshow", (event) => {
    console.info("[OERP lifecycle] pageshow", {
      persisted: event.persisted,
      time: now(),
    });
  });

  window.addEventListener("pagehide", (event) => {
    console.warn("[OERP lifecycle] pagehide", {
      persisted: event.persisted,
      time: now(),
    });
  });

  document.addEventListener("visibilitychange", () => {
    console.info("[OERP lifecycle] visibilitychange", {
      visibility: document.visibilityState,
      time: now(),
    });
  });

  window.addEventListener("beforeunload", () => {
    console.warn("[OERP lifecycle] beforeunload", {
      url: window.location.href,
      time: now(),
    });
  });
}

setupChunkReloadRecovery();
setupLifecycleLogging();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);