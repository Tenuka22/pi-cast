import { cors } from "hono/cors"
import { ENV } from "varlock"

// Parse trusted origins from environment variable (comma-separated)
const trustedOrigins = ENV.TRUSTED_ORIGINS?.split(",").map((s) => s.trim()) || []

export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow any origin from trusted origins list
    if (trustedOrigins.includes(origin)) {
      return origin
    }
    // Fallback to first trusted origin if no match
    return trustedOrigins[0] || "*"
  },
  allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
  exposeHeaders: ["Content-Length", "X-Retry-After", "X-Response-Time"],
  credentials: true,
  maxAge: 10 * 60, // 10 min
})
