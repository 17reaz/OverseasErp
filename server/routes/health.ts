import { Hono } from "hono"

const health = new Hono()

health.get("/", (c) => {
  return c.json({
    ok: true,
    service: "overseas-erp-api",
    runtime: "deno",
    framework: "hono",
    timestamp: new Date().toISOString(),
  })
})

export default health