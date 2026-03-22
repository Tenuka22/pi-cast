import { oAuth, oAuthAdmin, oAuthVerified } from "."

export const getProfile = oAuth
  .route({ method: "GET", path: "/profile" })
  .handler(async ({ context }) => {
    const session = context.userSession

    return {
      user: session?.user,
      session: session?.session,
    }
  })

export const getVerifiedProfile = oAuthVerified
  .route({ method: "GET", path: "/profile/verified" })
  .handler(async ({ context }) => {
    const session = context.userSession
    if (!session) {
      throw new Error("Session is null")
    }

    return {
      user: session.user,
    }
  })

export const getAdminData = oAuthAdmin
  .route({ method: "GET", path: "/admin" })
  .handler(async ({ context }) => {
    const session = context.userSession
    if (!session) {
      throw new Error("Session is null")
    }

    return {
      message: "Admin data accessed",
      user: session.user,
    }
  })
