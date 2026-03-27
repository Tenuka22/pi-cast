/**
 * Error codes for consistent error handling
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

  // Client errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * API error interface for consistent error responses
 */
export interface ApiError {
  code: ErrorCode
  message: string
  status: number
  details?: Record<string, unknown>
  timestamp: string
}

/**
 * Convert unknown error to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
      status: 500,
      timestamp: new Date().toISOString(),
    }
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return error as ApiError
  }

  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: String(error),
    status: 500,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const apiError = toApiError(error)
  const friendlyMessages: Partial<Record<ErrorCode, string>> = {
    [ERROR_CODES.UNAUTHORIZED]: "Please sign in to continue",
    [ERROR_CODES.INVALID_CREDENTIALS]: "Invalid email or password",
    [ERROR_CODES.SESSION_EXPIRED]: "Your session has expired. Please sign in again",
    [ERROR_CODES.FORBIDDEN]: "You don't have permission to do this",
    [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again",
    [ERROR_CODES.NOT_FOUND]: "The requested resource was not found",
    [ERROR_CODES.RATE_LIMITED]: "Too many attempts. Please wait a moment",
    [ERROR_CODES.OTP_EXPIRED]: "The verification code has expired",
    [ERROR_CODES.OTP_INVALID]: "Invalid verification code",
    [ERROR_CODES.NETWORK_ERROR]: "Network error. Please check your connection",
    [ERROR_CODES.TIMEOUT_ERROR]: "Request timed out. Please try again",
  }
  return friendlyMessages[apiError.code] || apiError.message || fallback
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  const apiError = toApiError(error)
  const authCodes: ErrorCode[] = [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.INVALID_CREDENTIALS,
    ERROR_CODES.SESSION_EXPIRED,
    ERROR_CODES.INVALID_TOKEN,
  ]
  return authCodes.includes(apiError.code)
}

/**
 * Check if error is validation related
 */
export function isValidationError(error: unknown): boolean {
  const apiError = toApiError(error)
  const validationCodes: ErrorCode[] = [
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.INVALID_INPUT,
    ERROR_CODES.MISSING_FIELD,
  ]
  return validationCodes.includes(apiError.code)
}
