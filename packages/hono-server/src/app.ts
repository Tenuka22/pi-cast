import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { auth } from "@pi-cast/orpc-handlers"
import { ENV } from "varlock/env"

export const app = new Hono()

app.use("*", logger())

app.use(
  "*",
  cors({
    origin: ENV.WEB_CLIENT_URL,
    credentials: true,
  })
)

app.get("/health", (c) => {
  return c.json({ status: "ok" })
})

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404)
})
