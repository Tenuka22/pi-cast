import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from '@pi-cast/orpc-handlers'

export const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.use('/api/auth/*', (c) => auth.handler(c.req.raw))

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})
