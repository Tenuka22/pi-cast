import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { RPCHandler } from "@orpc/server/fetch"
import { getProfile, getVerifiedProfile, getAdminData, getPublicData } from "@pi-cast/orpc-handlers/routes"
import {
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  formatErrorResponse,
  AppHTTPException,
} from "./middleware"
import { corsMiddleware } from "./middlewares/cors"
import { secureHeadersMiddleware } from "./middlewares/secure-headers"
import { BETTER_AUTH_BASE_PATH } from "./lib/constants"
import authRoute from "./routes/auth"

const logger = createLogger({ prefix: "[Hono]" })

export const app = new Hono()

// Global error handler - must be first
app.use("*", errorHandler(logger))

// Request logging
app.use("*", requestLogger(logger))

// Middlewares
app.use("*", corsMiddleware)
app.use("*", secureHeadersMiddleware)

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Auth routes - separate Better Auth handler
app.route(BETTER_AUTH_BASE_PATH, authRoute)

// Create oRPC handler with individual procedures
const rpcHandler = new RPCHandler({
  getProfile,
  getVerifiedProfile,
  getAdminData,
  getPublicData,
})

// oRPC routes with headers passed to context
app.use("/api/trpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/api/trpc",
    context: {
      headers: c.req.raw.headers,
    },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }
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
