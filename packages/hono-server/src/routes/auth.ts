import { auth } from "@/lib/auth"
import { Hono } from "hono"

const app = new Hono()

app.on(["POST", "GET", "OPTIONS"], "/*", (c) => {
  return auth.handler(c.req.raw)
})

export default app
