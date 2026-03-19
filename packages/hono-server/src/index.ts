import { serve } from "@hono/node-server"
import { app } from "./app"
import { ENV } from "varlock/env"
import { createLogger } from "./middleware"

const logger = createLogger({ prefix: "[Server]" })
const port = ENV.PORT

logger.info("=== Hono Server Starting ===")
logger.info(`Port: ${port}`)
logger.info(`URL: http://localhost:${port}`)
logger.info(`Health check: http://localhost:${port}/health`)
logger.info("============================")

try {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      logger.info(`✅ Server running on http://localhost:${info.port}`)
    }
  )
} catch (error) {
  logger.error("❌ Failed to start server", {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
}
