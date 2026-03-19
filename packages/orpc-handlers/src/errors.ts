import { ORPCError } from "@orpc/server"

/**
 * Error codes for typed error handling
 */
export const ERROR_CODES = {
  // Authentication errors (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",

  // Authorization errors (403)
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Validation errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",

  // Resource errors (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Conflict errors (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // Server errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Rate limiting (429)
  RATE_LIMITED: "RATE_LIMITED",

  // OTP specific errors
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  OTP_NOT_FOUND: "OTP_NOT_FOUND",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Typed error options
 */
export interface ErrorOptions {
  code: ErrorCode
  message: string
  status?: number
  details?: Record<string, unknown>
  cause?: unknown
}

/**
 * Base typed error for oRPC
 */
export class AppError extends ORPCError<ErrorCode, undefined> {
  public readonly code: ErrorCode
  public readonly status: number
  public readonly details?: Record<string, unknown>
  public readonly timestamp: string

  constructor(options: ErrorOptions) {
    super(options.code, {
      message: options.message,
      status: options.status,
      data: options.details as undefined,
    })

    this.code = options.code
    this.status = options.status || 500
    this.details = options.details
    this.timestamp = new Date().toISOString()

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * Authentication error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: Record<string, unknown>) {
    super({
      code: ERROR_CODES.UNAUTHORIZED,
      message,
      status: 401,
      details,
    })
  }
}

/**
 * Invalid credentials error (401)
 */
export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid credentials") {
    super({
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message,
      status: 401,
    })
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: Record<string, unknown>) {
    super({
      code: ERROR_CODES.FORBIDDEN,
      message,
      status: 403,
      details,
    })
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(
    message = "Validation error",
    details?: Record<string, unknown>
  ) {
    super({
      code: ERROR_CODES.VALIDATION_ERROR,
      message,
      status: 400,
      details,
    })
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource", details?: Record<string, unknown>) {
    super({
      code: ERROR_CODES.NOT_FOUND,
      message: `${resource} not found`,
      status: 404,
      details,
    })
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: Record<string, unknown>) {
    super({
      code: ERROR_CODES.CONFLICT,
      message,
      status: 409,
      details,
    })
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  constructor(
    message = "Internal server error",
    details?: Record<string, unknown>
  ) {
    super({
      code: ERROR_CODES.INTERNAL_ERROR,
      message,
      status: 500,
      details,
    })
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(message = "Database error", cause?: unknown) {
    super({
      code: ERROR_CODES.DATABASE_ERROR,
      message,
      status: 500,
      cause,
    })
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: Record<string, unknown>) {
    super({
      code: ERROR_CODES.RATE_LIMITED,
      message,
      status: 429,
      details,
    })
  }
}

/**
 * OTP expired error (400)
 */
export class OTPExpiredError extends AppError {
  constructor() {
    super({
      code: ERROR_CODES.OTP_EXPIRED,
      message: "OTP has expired",
      status: 400,
    })
  }
}

/**
 * OTP invalid error (400)
 */
export class OTPInvalidError extends AppError {
  constructor() {
    super({
      code: ERROR_CODES.OTP_INVALID,
      message: "Invalid OTP",
      status: 400,
    })
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard to check if error has a specific code
 */
export function isAppErrorWithCode<T extends ErrorCode>(
  error: unknown,
  code: T
): error is AppError & { code: T } {
  return error instanceof AppError && error.code === code
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    return new InternalError(error.message)
  }
  
  return new InternalError("An unexpected error occurred")
}
