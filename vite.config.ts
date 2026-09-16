import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim()
  } catch {
    // git na thakle (docker build e .git na thaklew) env var theke fallback
    return (
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.GITHUB_SHA?.slice(0, 7) ??
      process.env.COMMIT_SHA?.slice(0, 7) ??
      "unknown"
    )
  }
}
// https://vite.dev/config/
export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(getCommitHash()),
  },
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "prompt",
      injectRegister: false, // registration amra nijera code e korbo
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // dev e test korte chaile true koro
        type: "module",
      },
      manifest: {
        name: "Overseas ERP",
        short_name: "Overseas ERP",
        description: "Overseas ERP Management System",

        start_url: "/",
        scope: "/",

        display: "standalone",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})