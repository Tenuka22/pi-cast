import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { AuthConfig, createAuth } from "@pi-cast/db/auth-init"
import { ENV } from "varlock/env"
import {
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  formatErrorResponse,
  AppHTTPException,
} from "./middleware"

const logger = createLogger({ prefix: "[Hono]" })

export const app = new Hono()

// Global error handler - must be first
app.use("*", errorHandler(logger))

// Request logging
app.use("*", requestLogger(logger))

// CORS
app.use(
  "*",
  cors({
    origin: ENV.WEB_CLIENT_URL,
    credentials: true,
    exposeHeaders: ["X-Response-Time"],
  })
)

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

const authConfig: AuthConfig = {
  DATABASE_URL: ENV.DATABASE_URL,
  WEB_CLIENT_URL: ENV.WEB_CLIENT_URL,
  BETTER_AUTH_URL: ENV.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET,
  GITHUB_CLIENT_ID: ENV.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: ENV.GITHUB_CLIENT_SECRET,
  TRUSTED_ORIGINS: ENV.TRUSTED_ORIGINS,
  COOKIE_SECURE: ENV.COOKIE_SECURE,
  COOKIE_SAME_SITE: ENV.COOKIE_SAME_SITE,
  RATE_LIMIT_ENABLED: ENV.RATE_LIMIT_ENABLED,
  RATE_LIMIT_WINDOW_MS: ENV.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: ENV.RATE_LIMIT_MAX_REQUESTS,
}

const auth = createAuth(authConfig)
// Auth routes - let Better Auth handle errors
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

// 404 handler
app.notFound(notFoundHandler(logger))

// Global error handler for response formatting
app.onError((err, c) => {
  logger.error(`Error: ${err.message}`, {
    name: err.name,
    stack: err.stack,
  })

  if (err instanceof AppHTTPException || err instanceof HTTPException) {
    return c.json(formatErrorResponse(err), err.status)
  }

  return c.json(
    formatErrorResponse(
      new AppHTTPException(500, {
        message: err.message,
        code: "INTERNAL_ERROR",
      })
    ),
    500
  )
})
