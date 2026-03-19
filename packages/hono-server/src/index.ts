import { serve } from "@hono/node-server"
import { app } from "./app"
import { ENV } from "varlock/env"

const port = ENV.PORT

console.log("=== Hono Server Starting ===")
console.log(`Port: ${port}`)
console.log(`URL: http://localhost:${port}`)
console.log(`Health check: http://localhost:${port}/health`)
console.log("============================")

try {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`✅ Server running on http://localhost:${info.port}`)
    }
  )
} catch (error) {
  console.error("❌ Failed to start server:", error)
  process.exit(1)
}
