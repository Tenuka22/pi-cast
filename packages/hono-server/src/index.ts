import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.PORT)

console.log(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
