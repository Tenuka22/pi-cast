import { ORPCError } from "@orpc/server"
import { toAppError } from "./errors"

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
 * Default console logger with formatting
 */
export const consoleLogger: Logger = {
  debug: (message, ...args) => {
    console.log(`\u001b[36m[DEBUG]\u001b[0m ${new Date().toISOString()} - ${message}`, ...args)
  },
  info: (message, ...args) => {
    console.log(`\u001b[32m[INFO]\u001b[0m ${new Date().toISOString()} - ${message}`, ...args)
  },
  warn: (message, ...args) => {
    console.warn(`\u001b[33m[WARN]\u001b[0m ${new Date().toISOString()} - ${message}`, ...args)
  },
  error: (message, ...args) => {
    console.error(`\u001b[31m[ERROR]\u001b[0m ${new Date().toISOString()} - ${message}`, ...args)
  },
}

/**
 * Error logging options
 */
export interface ErrorLoggingOptions {
  logger?: Logger
  includeStackTrace?: boolean
  includeCause?: boolean
}

/**
 * Get error message safely
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "object" && error !== null) {
    const entries = Object.entries(error)
    const messageEntry = entries.find(([key]) => key === "message")
    if (messageEntry && typeof messageEntry[1] === "string") {
      return messageEntry[1]
    }
  }
  return String(error)
}

/**
 * Format error for logging
 */
function formatError(
  error: unknown,
  options: ErrorLoggingOptions
): Record<string, unknown> {
  const { includeStackTrace, includeCause } = options

  if (error instanceof ORPCError) {
    const formatted: Record<string, unknown> = {
      type: error.constructor.name,
      code: String(error.code),
      message: getErrorMessage(error),
      status: error.status,
    }

    if (includeStackTrace && error.stack) {
      formatted.stack = error.stack.split("\n").slice(0, 10).join("\n")
    }

    if (includeCause && error.cause) {
      formatted.cause = error.cause instanceof Error ? error.cause.message : error.cause
    }

    return formatted
  }

  if (error instanceof Error) {
    const formatted: Record<string, unknown> = {
      type: error.constructor.name,
      message: error.message,
    }

    if (includeStackTrace && error.stack) {
      formatted.stack = error.stack.split("\n").slice(0, 10).join("\n")
    }

    return formatted
  }

  return {
    type: typeof error,
    message: String(error),
  }
}

/**
 * Middleware context for oRPC
 */
export interface MiddlewareContext {
  path: string[]
  next: () => Promise<unknown>
  signal?: AbortSignal
}

/**
 * Create error logging middleware for oRPC
 */
export function createErrorMiddleware(options: ErrorLoggingOptions = {}) {
  const {
    logger = consoleLogger,
    includeStackTrace = false,
    includeCause = true,
  } = options

  return async function errorMiddleware(ctx: MiddlewareContext): Promise<unknown> {
    const startTime = Date.now()
    const path = ctx.path.join(".")

    try {
      const result = await ctx.next()
      const duration = Date.now() - startTime

      logger.info(`[oRPC] ${path} - ${duration}ms`)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const appError = toAppError(error)

      // Log the error
      logger.error(`[oRPC] ${path} - ${duration}ms - ${appError.code}`)

      // Log additional error details
      const errorDetails = formatError(error, {
        includeStackTrace,
        includeCause,
      })

      logger.debug(`[oRPC Error Details] ${path}`, errorDetails)

      // Re-throw the error
      throw appError
    }
  }
}

/**
 * Create request logging middleware
 */
export function createLoggingMiddleware(options: { logger?: Logger } = {}) {
  const { logger = consoleLogger } = options

  return async function loggingMiddleware(ctx: MiddlewareContext): Promise<unknown> {
    const startTime = Date.now()
    const path = ctx.path.join(".")

    logger.debug(`[oRPC Request] ${path}`)

    try {
      const result = await ctx.next()
      const duration = Date.now() - startTime

      logger.info(`[oRPC Response] ${path} - ${duration}ms`)

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error(`[oRPC Failed] ${path} - ${duration}ms`)

      throw error
    }
  }
}

/**
 * Combined middleware for logging and error handling
 */
export function createORPCMiddleware(options: ErrorLoggingOptions & { logger?: Logger } = {}) {
  return [
    createLoggingMiddleware({ logger: options.logger }),
    createErrorMiddleware(options),
  ]
}
