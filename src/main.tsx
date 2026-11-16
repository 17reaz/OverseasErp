import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./app/App";
import { AppErrorBoundary } from "./components/error-boundary";
import { TooltipProvider } from "./components/ui/tooltip";
import { queryClient } from "./lib/tanstack/query-client";
import { ThemeProvider } from "./components/theme-provider";
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

    try {
      const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);

      if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) return;

      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // sessionStorage unavailable; reload once anyway.
    }

    window.location.reload();
  });
}

setupChunkReloadRecovery();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider    >
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);