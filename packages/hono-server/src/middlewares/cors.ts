import { WEB_CLIENT_URL } from "@/lib/constants"
import { cors } from "hono/cors"

export const corsMiddleware = cors({
  origin: [WEB_CLIENT_URL],
  allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
  exposeHeaders: ["Content-Length", "X-Retry-After", "X-Response-Time"],
  credentials: true,
  maxAge: 10 * 60, // 10 min
})
