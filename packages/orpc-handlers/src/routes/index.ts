import { os } from "@orpc/server"

import { Auth, Database } from "@pi-cast/db"
import { UnauthorizedError } from "../errors"

// ---------------------
// Context Types
// ---------------------
export type AppContext = {
  headers: Headers
  auth: Auth
  db: Database
  userSession: Auth["$Infer"]["Session"] | null
}
// ---------------------
// Base oRPC Context
// ---------------------
export const o = os.$context<AppContext>()

// ---------------------
// Middleware for optional auth
// ---------------------
const oAuthMiddleware = o.middleware(async ({ context, next }) => {
  const userSession = await context.auth.api.getSession({
    headers: context.headers,
  })

  return next({ context: { ...context, userSession } })
})

export const oAuth = o.use(oAuthMiddleware)

// ---------------------
// Middleware for required auth
// ---------------------
const oAuthReqMiddleware = o.middleware(async ({ context, next }) => {
  const userSession = context.userSession
  if (!userSession) {
    throw new UnauthorizedError("Missing headers in context")
  }

  return next({ context })
})

export const oAuthReq = oAuth.use(oAuthReqMiddleware)

// ---------------------
// Middleware for verified email
// ---------------------
const oAuthVerifiedEmail = o.middleware(async ({ context, next }) => {
  if (!context.userSession?.user.emailVerified) {
    throw new UnauthorizedError("Missing email verification")
  }

  return next({ context })
})

export const oAuthVerified = oAuthReq.use(oAuthVerifiedEmail)

// ---------------------
// Middleware for admin role
// ---------------------
const oAuthAdminRequired = o.middleware(async ({ context, next }) => {
  if (context.userSession?.user.role !== "admin") {
    throw new UnauthorizedError("Missing role as admin")
  }

  return next({ context })
})

export const oAuthAdmin = oAuthVerified.use(oAuthAdminRequired)
