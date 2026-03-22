import { defineConfig } from "drizzle-kit"
import { ENV } from "varlock/env"

export default defineConfig({
  dialect: "turso",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: ENV.DATABASE_URL,
    authToken: ENV.DATABASE_TOKEN,
  },
})
