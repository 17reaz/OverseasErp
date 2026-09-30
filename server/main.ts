import { Hono } from "hono"

import healthRoute from "./routes/health"

const app = new Hono()

app.route("/api/health", healthRoute)

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "overseas-erp-api",
    runtime: "bun",
    framework: "hono",
  })
})

const port = Number(process.env.PORT ?? 5173)

console.log(`🚀 Hono API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}