import { BETTER_AUTH_BASE_PATH, SERVER_URL } from "@pi-cast/constants"
import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"
import { organizationClient } from "better-auth/client/plugins"

/**
 * Better Auth client for React (Client-side)
 */
export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  basePath: BETTER_AUTH_BASE_PATH,
  fetchOptions: {
    baseURL: SERVER_URL + BETTER_AUTH_BASE_PATH,
    credentials: "include",
  },
  plugins: [emailOTPClient(), organizationClient()],
})

export const { useSession } = authClient
export const { signIn } = authClient
export const { signOut } = authClient
export const { sendVerificationOtp } = authClient.emailOtp
export const signInWithOTP = authClient.signIn.emailOtp
export const { updateUser } = authClient
export const { changeEmail } = authClient
export const { deleteUser } = authClient
export const { listSessions } = authClient
export const { revokeSession } = authClient
export const { organization } = authClient

export async function getSession() {
  const { data } = await authClient.getSession()
  return data
}
