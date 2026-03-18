import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { AuthRouter } from '@pi-cast/orpc-handlers/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const authClient = createORPCClient<RouterClient<AuthRouter>>(
  new RPCLink({
    url: `${API_URL}/api/auth`,
  }),
)
