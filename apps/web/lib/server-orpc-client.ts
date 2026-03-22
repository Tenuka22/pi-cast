"server-only"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { RouterClientType } from "@pi-cast/orpc-handlers/routes/handlers"
import { headers } from "next/headers"
import { ENV } from "varlock/env"

const link = new RPCLink({
  url: ENV.NEXT_PUBLIC_API_URL + "/api/trpc/",
  headers: async () => {
    const headersList = await headers()
    const cookie = headersList.get("Cookie")

    if (!cookie) return {}

    return {
      Cookie: cookie,
    }
  },
})

export const orpc: RouterClientType = createORPCClient(link)
