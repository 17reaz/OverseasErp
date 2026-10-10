import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./app/App";
import { TooltipProvider } from "./components/ui/tooltip";
import { queryClient } from "./lib/tanstack/query-client";

import "./index.css";

// Deploy er por purano chunk 404 hole: SW + cache clear kore reload
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  const KEY = "chunk-reload-at";
  const last = Number(sessionStorage.getItem(KEY) ?? 0);
  if (Date.now() - last < 10_000) return; // reload loop thekano

  sessionStorage.setItem(KEY, String(Date.now()));

  void (async () => {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs ?? []).map((r) => r.unregister()));

      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } finally {
      window.location.reload();
    }
  })();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>
);