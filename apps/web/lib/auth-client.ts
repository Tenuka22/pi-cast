import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  magicLinkClient,
  twoFactorClient,
} from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    organizationClient(),
    adminClient(),
    magicLinkClient(),
    twoFactorClient(),
  ],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  updateUser,
  changeEmail,
  deleteUser,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  twoFactor,
  organization,
} = authClient
