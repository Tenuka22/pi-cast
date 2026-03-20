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
 * 
 * This client is designed to run in React components (Client Components).
 * It provides hooks and functions for authentication.
 */
export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
  basePath: BETTER_AUTH_BASE_PATH,
  plugins: [organizationClient(), adminClient(), emailOTPClient()],
  fetchOptions: {
    baseURL: BETTER_AUTH_URL + BETTER_AUTH_BASE_PATH,
  },
})
