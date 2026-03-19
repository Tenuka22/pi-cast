import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  emailOTPClient,
} from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    organizationClient(),
    adminClient(),
    emailOTPClient(),
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
  organization,
} = authClient

export const sendVerificationOtp = authClient.emailOtp.sendVerificationOtp
export const signInWithOTP = authClient.signIn.emailOtp
