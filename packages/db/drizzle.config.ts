import { defineConfig } from "drizzle-kit"
import { ENV } from "varlock/env"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: ENV.DATABASE_URL,
  },
})
