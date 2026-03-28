import { OpenAPIHono } from "@hono/zod-openapi"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { secureHeaders } from "hono/secure-headers"
import { createProfileRoutes } from "./routes/profile"
import { createAdminRoutes } from "./routes/admin"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "@/db/schema"
import { DrizzleD1Database } from "drizzle-orm/d1"
import type { Session, User } from "better-auth"
import { createAuth } from "./auth/auth.config"
import { Scalar } from "@scalar/hono-api-reference"

// Auth and Session types
export type Auth = ReturnType<typeof createAuth>
export type AuthSession = Session | null
export type AuthUser = (User & { role: "admin" | "teacher" | "user" }) | null

// Variables type for Hono context
export type Variables = {
  auth: Auth
  db: DrizzleD1Database<typeof schema>
  session: AuthSession
  user: AuthUser
}

// Context type
export type Context = { Bindings: CloudflareBindings; Variables: Variables }

// Create main OpenAPI Hono app
export const app = new OpenAPIHono<Context>()

// Auth middleware - makes auth instance available to all routes
app.use("*", async (c, next) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const auth = createAuth(c.env, (c.req.raw.cf || {}) as any)
  c.set("auth", auth)
  await next()
})

// Database middleware - makes db instance available to all routes
app.use("*", async (c, next) => {
  const db = drizzle(c.env.DATABASE, { schema, logger: true })
  c.set("db", db)
  await next()
})

// Session middleware - makes session and user available to all routes
app.use("*", async (c, next) => {
  const auth = c.get("auth")
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  console.log(session, c.req.raw.headers)
  c.set("session", session?.session ?? null)
  c.set("user", session?.user ?? null)
  await next()
})

// General middleware
app.use("*", logger())
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8787"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    exposeHeaders: ["Content-Length", "X-Response-Time"],
    credentials: true,
    maxAge: 600,
  })
)
app.use("*", secureHeaders())

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

// Better Auth routes
app.on(["POST", "GET", "OPTIONS"], "/api/auth/*", (c) => {
  const auth = c.get("auth")
  return auth.handler(c.req.raw)
})

// Profile and Admin routes
app.route("/", createProfileRoutes())
app.route("/", createAdminRoutes())

// OpenAPI documentation - auto-generates from registered routes
app.doc("/api/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Pi-Cast API",
    description: "Pi-Cast API documentation with Better Auth integration",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:8787",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Authentication endpoints",
    },
    {
      name: "Profile",
      description: "User profile management",
    },
    {
      name: "Admin",
      description: "Admin-only endpoints",
    },
  ],
})

// OpenAPI Scalar Documentation UI
app.get(
  "/api/reference",
  Scalar({
    url: "/api/openapi.json",
  })
)

export default app
