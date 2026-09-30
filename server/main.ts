import { Hono } from "hono"

import { config } from "./config"
import healthRoute from "./routes/health"

const app = new Hono()

// Global error handler
app.onError((error, c) => {
  console.error("[API ERROR]", error)

  return c.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    500,
  )
})

// Global 404 handler
app.notFound((c) => {
  return c.json(
    {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404,
  )
})

// Routes
app.route("/api/health", healthRoute)

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "overseas-erp-api",
    runtime: "bun",
    framework: "hono",
  })
})

console.log(`🚀 Hono API running on http://localhost:${config.port}`)

export default {
  port: config.port,
  fetch: app.fetch,
}