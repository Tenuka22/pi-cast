import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { auth } from "@pi-cast/orpc-handlers"
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
