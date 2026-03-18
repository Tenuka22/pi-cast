import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { AuthRouter } from '@pi-cast/orpc-handlers/auth'

export function createAuthClient(baseUrl: string) {
  const link = new RPCLink({
    url: `${baseUrl}/api/auth`,
  })

  return createORPCClient<RouterClient<AuthRouter>>(link)
}
