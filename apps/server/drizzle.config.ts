import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/auth.schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: "sqlite.db", // Local SQLite file for migration generation
  },
})
