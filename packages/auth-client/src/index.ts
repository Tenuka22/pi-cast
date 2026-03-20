/**
 * @pi-cast/auth-client
 * 
 * Client-side Better Auth client for React components.
 * 
 * @example
 * ```ts
 * import { authClient, signIn, signUp, useSession } from "@pi-cast/auth-client"
 * 
 * // In a Client Component
 * function LoginForm() {
 *   const { data: session } = useSession()
 *   
 *   const handleSignIn = async () => {
 *     await signIn.email({ email, password })
 *   }
 * }
 * ```
 */

import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  emailOTPClient,
} from "better-auth/client/plugins"
import {
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_URL,
} from "./config"

/**
 * Better Auth client for React (Client-side)
 */
export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
  basePath: BETTER_AUTH_BASE_PATH,
  plugins: [organizationClient(), adminClient(), emailOTPClient()],
  fetchOptions: {
    baseURL: BETTER_AUTH_URL + BETTER_AUTH_BASE_PATH,
  },
})

// Export auth methods from the client instance
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
  organization,
} = authClient

// OTP helpers
export const sendVerificationOtp = authClient.emailOtp.sendVerificationOtp
export const signInWithOTP = authClient.signIn.emailOtp

// Re-export plugin clients for advanced usage
export {
  adminClient,
  organizationClient,
  emailOTPClient,
} from "better-auth/client/plugins"

// Re-export config
export {
  BETTER_AUTH_URL,
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_COOKIE_PREFIX,
} from "./config"
