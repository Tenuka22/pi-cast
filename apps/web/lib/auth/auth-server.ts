"server-only"
import {
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_COOKIE_PREFIX,
} from "@pi-cast/auth-client/config"
import { createAuthClient } from "better-auth/client"
import type { RequestContext } from "better-auth/client"
import { headers } from "next/headers"
import { ENV } from "varlock/env"

export const authServerClient = createAuthClient({
  baseURL: ENV.BETTER_AUTH_URL,
  basePath: BETTER_AUTH_BASE_PATH,
  fetchOptions: {
    baseURL: ENV.BETTER_AUTH_URL + BETTER_AUTH_BASE_PATH,
    onRequest: async (context: RequestContext) => {
      const headersList = await headers()
      const cookie = headersList.get("Cookie")
      if (cookie) {
        const authCookies = cookie
          .split(";")
          .map((c: string) => c.trim())
          .filter(
            (c: string) =>
              c.startsWith(`${BETTER_AUTH_COOKIE_PREFIX}.`) ||
              c.startsWith(`__Secure-${BETTER_AUTH_COOKIE_PREFIX}.`)
          )
          .join("; ")

        if (authCookies && context.headers) {
          context.headers.set("Cookie", authCookies)
        }
      }
    },
  },
})
