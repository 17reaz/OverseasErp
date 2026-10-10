
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./app/App";
import { TooltipProvider } from "./components/ui/tooltip";
import { queryClient } from "./lib/tanstack/query-client";

import "./index.css";

const RELOAD_KEY = "oerp-chunk-reload-at";
const RELOAD_COOLDOWN = 30_000;

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  const error = (
    event as Event & { payload?: unknown }
  ).payload;

  console.error(
    "[OverseasErp] Dynamic import failed:",
    error,
  );

  const lastReload = Number(
    sessionStorage.getItem(RELOAD_KEY) ?? 0,
  );

  // Prevent repeated reload loops.
  if (Date.now() - lastReload < RELOAD_COOLDOWN) {
    console.error(
      "[OverseasErp] Reload skipped: cooldown active.",
    );
    return;
  }

  sessionStorage.setItem(
    RELOAD_KEY,
    String(Date.now()),
  );

  // Keep Service Workers and caches intact.
  window.location.reload();
});

console.info("[OERP lifecycle] document started", {
  time: new Date().toISOString(),
  navigationType:
    performance.getEntriesByType("navigation")[0] &&
    (
      performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    ).type,
  visibility: document.visibilityState,
});

window.addEventListener("pagehide", (event) => {
  console.warn("[OERP lifecycle] pagehide", {
    persisted: event.persisted,
    time: new Date().toISOString(),
  });
});

window.addEventListener("pageshow", (event) => {
  console.info("[OERP lifecycle] pageshow", {
    persisted: event.persisted,
    time: new Date().toISOString(),
  });
});

document.addEventListener("visibilitychange", () => {
  console.info("[OERP lifecycle] visibilitychange", {
    visibility: document.visibilityState,
    time: new Date().toISOString(),
  });
});

window.addEventListener("beforeunload", () => {
  console.warn("[OERP lifecycle] beforeunload", {
    time: new Date().toISOString(),
    url: window.location.href,
  });
});

window.addEventListener("pagehide", (event) => {
  console.warn("[OERP lifecycle] pagehide", {
    persisted: event.persisted,
    time: new Date().toISOString(),
  });
});

window.addEventListener("pageshow", (event) => {
  console.info("[OERP lifecycle] pageshow detail", {
    persisted: event.persisted,
    time: new Date().toISOString(),
  });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
