import type { Auth } from "@pi-cast/db/auth-init"
import { ORPCError } from "@orpc/server"
import { ERROR_CODES, type ErrorCode } from "./errors"

/**
 * Session data from Better Auth
 */
export interface AuthSession {
  session: {
    id: string
    userId: string
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    ipAddress?: string | null
    userAgent?: string | null
    activeOrganizationId?: string | null
    impersonatedBy?: string | null
  }
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    role?: string | null
    banned?: boolean | null
    banReason?: string | null
    banExpires?: Date | null
  }
}

/**
 * Auth helper options
 */
export interface AuthHelperOptions {
  /**
   * Require email verification
   * @default false
   */
  requireEmailVerified?: boolean

  /**
   * Required roles (user must have at least one)
   * @default undefined
   */
  requiredRoles?: string[]

  /**
   * Custom error code for unauthorized
   * @default "UNAUTHORIZED"
   */
  unauthorizedErrorCode?: ErrorCode
}

/**
 * Create an auth helper function that fetches session from headers
 *
 * @param auth - Better Auth instance
 * @param options - Auth helper options
 *
 * @example
 * ```ts
 * import { auth } from "@pi-cast/db"
 * import { createGetAuthSession } from "@pi-cast/orpc-handlers"
 *
 * const getAuthSession = createGetAuthSession(auth)
 *
 * export const myRouter = router({
 *   protectedProcedure: procedure
 *     .handler(async ({ context }) => {
 *       const session = await getAuthSession(context.headers)
 *       // session.user and session.session are available
 *       return { user: session.user.email }
 *     }),
 * })
 * ```
 */
export function createGetAuthSession(
  auth: Auth,
  options: AuthHelperOptions = {}
) {
  const {
    requireEmailVerified = false,
    requiredRoles,
    unauthorizedErrorCode = ERROR_CODES.UNAUTHORIZED,
  } = options

  return async function getAuthSession(headers: Headers): Promise<AuthSession> {
    if (!headers) {
      throw new ORPCError(unauthorizedErrorCode, {
        message: "Missing headers in context",
        status: 401,
      })
    }

    // Use Better Auth's getSession API
    const sessionData = await auth.api.getSession({
      headers,
    })

    if (!sessionData?.session || !sessionData?.user) {
      throw new ORPCError(unauthorizedErrorCode, {
        message: "Invalid or expired session",
        status: 401,
      })
    }

    // Check email verification if required
    if (requireEmailVerified && !sessionData.user.emailVerified) {
      throw new ORPCError(ERROR_CODES.EMAIL_NOT_VERIFIED, {
        message: "Please verify your email to continue",
        status: 403,
      })
    }

    // Check roles if required
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = sessionData.user.role
      const hasRequiredRole = requiredRoles.some((role) => role === userRole)

      if (!hasRequiredRole) {
        throw new ORPCError(ERROR_CODES.INSUFFICIENT_PERMISSIONS, {
          message: "You don't have permission to do this",
          status: 403,
        })
      }
    }

    return {
      session: sessionData.session,
      user: sessionData.user,
    }
  }
}

/**
 * Create an optional auth helper - returns null if not authenticated
 */
export function createGetOptionalAuthSession(auth: Auth) {
  return async function getOptionalAuthSession(
    headers: Headers
  ): Promise<AuthSession | null> {
    if (!headers) {
      return null
    }

    const sessionData = await auth.api.getSession({ headers }).catch(() => null)

    if (!sessionData?.session || !sessionData?.user) {
      return null
    }

    return {
      session: sessionData.session,
      user: sessionData.user,
    }
  }
}
