import { Hono } from "hono"

import healthRoute from "./routes/health.ts"

const app = new Hono()

app.route("/api/health", healthRoute)

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "overseas-erp-api",
  })
})

Deno.serve(
  {
    port: 8000,
  },
  app.fetch,
)