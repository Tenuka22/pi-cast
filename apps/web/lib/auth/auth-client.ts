/**
 * Better Auth Client
 * Re-export from browser.ts for consistent imports
 */
export {
  authClient,
  useSession,
  signIn,
  signOut,
  sendVerificationOtp,
  signInWithOTP,
  updateUser,
  changeEmail,
  deleteUser,
  listSessions,
  revokeSession,
  getSession,
  organization,
} from "./browser"
