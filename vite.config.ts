import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { execSync } from "child_process"

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim()
  } catch {
    return (
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.GITHUB_SHA?.slice(0, 7) ??
      process.env.COMMIT_SHA?.slice(0, 7) ??
      "unknown"
    )
  }
}

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(getCommitHash()),
  },

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "prompt",
      injectRegister: false,

      workbox: {
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,

  cleanupOutdatedCaches: true,
  clientsClaim: true,

  // Lazy-loaded route chunks and heavy libraries
  // should NOT be downloaded during PWA install/update.
  globIgnores: [
    "**/react-pdf*.js",
    "**/*-page-*.js",
    "**/client-*.js",
    "**/workbox-*.js",
  ],

  runtimeCaching: [
    {
      urlPattern: ({ request }) =>
        request.destination === "script",

      handler: "CacheFirst",

      options: {
        cacheName: "oerp-js",

        expiration: {
          maxEntries: 80,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },

        cacheableResponse: {
          statuses: [200],
        },
      },
    },

    {
      urlPattern: ({ request }) =>
        request.destination === "style",

      handler: "CacheFirst",

      options: {
        cacheName: "oerp-css",

        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },

        cacheableResponse: {
          statuses: [200],
        },
      },
    },

    {
      urlPattern: ({ request }) =>
        request.destination === "font",

      handler: "CacheFirst",

      options: {
        cacheName: "oerp-fonts",

        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },

        cacheableResponse: {
          statuses: [200],
        },
      },
    },

    {
      urlPattern: ({ request }) =>
        request.destination === "image",

      handler: "CacheFirst",

      options: {
        cacheName: "oerp-images",

        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },

        cacheableResponse: {
          statuses: [200],
        },
      },
    },
  ],
},

      devOptions: {
        enabled: false,
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