/**
 * @pi-cast/auth-server
 * 
 * Server-side Better Auth client for Next.js Server Components.
 * 
 * @example
 * ```ts
 * import { authServerClient } from "@pi-cast/auth-server"
 * 
 * // In a Server Component
 * const session = await authServerClient.getSession()
 * ```
 */

export { authServerClient } from "./auth"
export {
  BETTER_AUTH_URL,
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_COOKIE_PREFIX,
} from "./config"
