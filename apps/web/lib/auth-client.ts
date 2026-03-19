import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  magicLinkClient,
} from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    organizationClient(),
    adminClient(),
    magicLinkClient(),
  ],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient
