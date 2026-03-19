// Re-export error utilities from @pi-cast/orpc-handlers for consistent error handling
export {
  ERROR_CODES,
  type ErrorCode,
  type ApiError,
  type ErrorResponse,
  isErrorResponse,
  isApiError,
  toApiError,
  getErrorMessage,
  isErrorCode,
  isAuthError,
  isValidationError,
  isRetryableError,
} from "@pi-cast/orpc-handlers"
