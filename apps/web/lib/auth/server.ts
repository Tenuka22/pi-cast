import "server-only"
import { headers } from "next/headers"
import { createAuthClient } from "better-auth/client"
import { emailOTPClient, organizationClient } from "better-auth/client/plugins"
import {
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_COOKIE_PREFIX,
  SERVER_URL,
} from "@pi-cast/constants"

/**
 * Better Auth client for Server-side
 */
export const authServerClient: ReturnType<typeof createAuthClient> =
  createAuthClient({
    baseURL: SERVER_URL,
    basePath: BETTER_AUTH_BASE_PATH,
    plugins: [emailOTPClient(), organizationClient()],
    fetchOptions: {
      baseURL: SERVER_URL + BETTER_AUTH_BASE_PATH,
      onRequest: async (context) => {
        const headersList = await headers()
        const cookie = headersList.get("Cookie")

        // Proxy auth-related cookies
        if (cookie) {
          const authCookies = cookie
            .split(";")
            .map((c) => c.trim())
            .filter(
              (c) =>
                c.startsWith(`${BETTER_AUTH_COOKIE_PREFIX}.`) ||
                c.startsWith(`__Secure-${BETTER_AUTH_COOKIE_PREFIX}.`)
            )
            .join("; ")

          if (authCookies) {
            context.headers.set("Cookie", authCookies)
          }
        }
      },
    },
  })
