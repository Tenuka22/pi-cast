import "server-only"
import { headers } from "next/headers"
import { createAuthClient } from "better-auth/client"
import type { RequestContext } from "better-auth/client"
import {
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_COOKIE_PREFIX,
  BETTER_AUTH_URL,
} from "./config"

/**
 * Better Auth client for Server-side
 *
 * This client is designed to run on the server-side (Next.js Server Components).
 * It proxies authentication-related cookies from incoming requests to the auth server.
 */
export const authServerClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
  basePath: BETTER_AUTH_BASE_PATH,
  fetchOptions: {
    baseURL: BETTER_AUTH_URL + BETTER_AUTH_BASE_PATH,
    onRequest: async (context: RequestContext) => {
      const headersList = await headers()
      const cookie = headersList.get("Cookie")

      // Proxy auth-related cookies
      if (cookie) {
        const authCookies = cookie
          .split(";")
          .map((c: string) => c.trim())
          .filter(
            (c: string) =>
              c.startsWith(`${BETTER_AUTH_COOKIE_PREFIX}.`) ||
              c.startsWith(`__Secure-${BETTER_AUTH_COOKIE_PREFIX}.`),
          )
          .join("; ")

        if (authCookies && context.headers) {
          context.headers.set("Cookie", authCookies)
        }
      }
    },
  },
})
