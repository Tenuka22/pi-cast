import { ENV } from "varlock/env"
import { AuthConfig, createAuth } from "./init"

const authConfig: AuthConfig = {
  DATABASE_URL: ENV.DATABASE_URL,
  WEB_CLIENT_URL: "http://localhost:3000",
  BETTER_AUTH_URL: "http://localhost:3001",
  BETTER_AUTH_SECRET: "supersecretkey123",
  GITHUB_CLIENT_ID: "abc123def456ghi789",
  GITHUB_CLIENT_SECRET: "ghijklmnop987654321",
  TRUSTED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
  COOKIE_SECURE: false,
  COOKIE_SAME_SITE: "lax",
  RATE_LIMIT_ENABLED: true,
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
}

export const auth = createAuth(authConfig)
