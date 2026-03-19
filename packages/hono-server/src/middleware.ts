import type { Context, MiddlewareHandler, Next } from "hono"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { ORPCError } from "@orpc/server"

/**
 * Log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error"

/**
 * Logger interface
 */
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

/**
 * Default console logger with colors and structured output
 */
export const createLogger = (options?: { prefix?: string }): Logger => {
  const prefix = options?.prefix || "[Hono]"

  const formatMessage = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    const colors = {
      debug: "\u001b[36m", // Cyan
      info: "\u001b[32m",  // Green
      warn: "\u001b[33m",  // Yellow
      error: "\u001b[31m", // Red
      reset: "\u001b[0m",
    }

    const color = colors[level]
    const levelPadded = level.toUpperCase().padEnd(5)
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""

    return `${color}${prefix} [${levelPadded}] ${timestamp} - ${message}${contextStr}${colors.reset}`
  }

  return {
    debug: (message, ...args) => console.debug(formatMessage("debug", message), ...args),
    info: (message, ...args) => console.info(formatMessage("info", message), ...args),
    warn: (message, ...args) => console.warn(formatMessage("warn", message), ...args),
    error: (message, ...args) => console.error(formatMessage("error", message), ...args),
  }
}

/**
 * Application error class for Hono
 */
export class AppHTTPException extends HTTPException {
  public readonly code?: string
  public readonly details?: Record<string, unknown>
  public readonly timestamp: string

  constructor(
    status: ContentfulStatusCode,
    options?: {
      message?: string
      code?: string
      details?: Record<string, unknown>
      cause?: unknown
    }
  ) {
    super(status, { message: options?.message, cause: options?.cause })
    this.code = options?.code
    this.details = options?.details
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    }
  }
}

/**
 * Error response body
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    status: number
    details?: Record<string, unknown>
    timestamp: string
  }
}

/**
 * Success response body
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  timestamp: string
}

/**
 * Request logging middleware
 */
export const requestLogger = (logger?: Logger): MiddlewareHandler => {
  const log = logger || createLogger()

  return async (c: Context, next: Next) => {
    const startTime = Date.now()
    const method = c.req.method
    const path = c.req.path
    const userAgent = c.req.header("user-agent")
    const referer = c.req.header("referer")

    log.debug(`← ${method} ${path}`, {
      userAgent,
      referer,
    })

    await next()

    const duration = Date.now() - startTime
    const status = c.res.status

    log.info(`→ ${method} ${path} ${status}`, {
      duration: `${duration}ms`,
      status,
    })

    // Add timing header
    c.res.headers.set("X-Response-Time", `${duration}ms`)
  }
}

/**
 * Convert ORPCError to HTTPException
 */
function convertORPCError(error: ORPCError<string, unknown>): HTTPException {
  return new AppHTTPException(error.status as ContentfulStatusCode, {
    message: (error as unknown as { message?: string }).message || "",
    code: error.code,
    cause: error.cause,
  })
}

/**
 * Global error handling middleware
 */
export const errorHandler = (logger?: Logger): MiddlewareHandler => {
  const log = logger || createLogger()

  return async (c: Context, next: Next) => {
    try {
      await next()
    } catch (error) {
      // Handle ORPC errors
      if (error instanceof ORPCError) {
        const httpError = convertORPCError(error as ORPCError<string, unknown>)
        log.error(`ORPC Error: ${httpError.message}`, {
          code: error.code,
          status: httpError.status,
        })
        throw httpError
      }

      // Handle HTTP exceptions
      if (error instanceof HTTPException) {
        log.error(`HTTP Exception: ${error.message}`, {
          status: error.status,
        })
        throw error
      }

      // Handle AppHTTPException
      if (error instanceof AppHTTPException) {
        log.error(`App Error: ${error.message}`, {
          code: error.code,
          status: error.status,
          details: error.details,
        })
        throw error
      }

      // Handle unknown errors
      const message = error instanceof Error ? error.message : "Unknown error"
      log.error(`Unhandled Error: ${message}`, {
        error: String(error),
      })

      throw new AppHTTPException(500, {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
        cause: error,
      })
    }
  }
}

/**
 * Format error response
 */
export const formatErrorResponse = (error: HTTPException | AppHTTPException): ErrorResponse => {
  const isAppError = error instanceof AppHTTPException

  return {
    success: false,
    error: {
      code: isAppError ? error.code || "HTTP_ERROR" : "HTTP_ERROR",
      message: error.message,
      status: error.status,
      details: isAppError ? error.details : undefined,
      timestamp: isAppError ? error.timestamp : new Date().toISOString(),
    },
  }
}

/**
 * Format success response
 */
export const formatSuccessResponse = <T>(data: T): SuccessResponse<T> => {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Not found handler
 */
export const notFoundHandler = (logger?: Logger) => {
  const log = logger || createLogger()

  return (c: Context) => {
    const method = c.req.method
    const path = c.req.path

    log.warn(`404 - ${method} ${path}`)

    return c.json(
      formatErrorResponse(
        new AppHTTPException(404, {
          message: "Not found",
          code: "NOT_FOUND",
        })
      ),
      404
    )
  }
}
