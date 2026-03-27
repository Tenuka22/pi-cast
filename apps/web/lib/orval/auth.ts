import { BETTER_AUTH_COOKIE_PREFIX } from "@pi-cast/constants"

export const extractAuthCookies = (cookie: string | null | undefined) => {
  return cookie
    ?.split(";")
    .map((c) => c.trim())
    .filter(
      (c) =>
        c.startsWith(`${BETTER_AUTH_COOKIE_PREFIX}.`) ||
        c.startsWith(`__Secure-${BETTER_AUTH_COOKIE_PREFIX}.`)
    )
    .join("; ")
}
