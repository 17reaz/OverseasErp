import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { execFileSync, execSync } from "child_process"
import { readFileSync } from "fs"
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
const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as {
  version: string
}

function getCommits(limit = 100) {
  try {
    const out = execFileSync(
      "git",
      ["log", "-n", String(limit), "--pretty=format:%h%x1f%an%x1f%aI%x1f%s"],
      { encoding: "utf-8", maxBuffer: 5 * 1024 * 1024 },
    )

    return out
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, author, date, subject] = line.split("\x1f")
        return { hash, author, date, subject }
      })
  } catch {
    return [] // git nei hole (jemon kono Docker build) khali thakbe
  }
}
export default defineConfig({
  define: {
  __COMMIT_HASH__: JSON.stringify(getCommitHash()),
  __APP_VERSION__: JSON.stringify(pkg.version),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __COMMITS__: JSON.stringify(getCommits()),
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

  handler: "StaleWhileRevalidate",

  options: {
    cacheName: "oerp-js",

    expiration: {
      maxEntries: 80,
      maxAgeSeconds: 60 * 60 * 24 * 7,
    },

    cacheableResponse: {
      statuses: [200],
    },
  },
},

    {
  urlPattern: ({ request }) =>
    request.destination === "style",

  handler: "StaleWhileRevalidate",

  options: {
    cacheName: "oerp-css",

    expiration: {
      maxEntries: 20,
      maxAgeSeconds: 60 * 60 * 24 * 7,
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
  server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
},
})