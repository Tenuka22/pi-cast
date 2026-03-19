import { auth } from "@pi-cast/db"
import { base, createGetAuthSession, createGetOptionalAuthSession } from "@pi-cast/orpc-handlers"

// Create auth session helpers
const getAuthSession = createGetAuthSession(auth)
const getOptionalAuthSession = createGetOptionalAuthSession(auth)

// Optional: create auth helper with email verification required
const getAuthSessionWithVerifiedEmail = createGetAuthSession(auth, {
  requireEmailVerified: true,
})

// Optional: create auth helper with role requirement
const getAuthSessionWithAdminRole = createGetAuthSession(auth, {
  requiredRoles: ["admin"],
})

// Example protected procedures
export const getProfile = base
  .route({ method: "GET", path: "/profile" })
  .handler(async ({ context }) => {
    const session = await getAuthSession(context.headers)
    return {
      user: session.user,
      session: session.session,
    }
  })

// Protected route - requires verified email
export const getVerifiedProfile = base
  .route({ method: "GET", path: "/profile/verified" })
  .handler(async ({ context }) => {
    const session = await getAuthSessionWithVerifiedEmail(context.headers)
    return {
      user: session.user,
    }
  })

// Protected route - requires admin role
export const getAdminData = base
  .route({ method: "GET", path: "/admin" })
  .handler(async ({ context }) => {
    const session = await getAuthSessionWithAdminRole(context.headers)
    return {
      message: "Admin data accessed",
      user: session.user,
    }
  })

// Optional auth route - session is optional
export const getPublicData = base
  .route({ method: "GET", path: "/public" })
  .handler(async ({ context }) => {
    const session = await getOptionalAuthSession(context.headers)
    return {
      isAuthenticated: !!session,
      user: session?.user ?? null,
    }
  })
