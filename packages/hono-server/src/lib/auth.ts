import { createAuth } from "@pi-cast/db/auth-init"
import type { AuthConfig } from "@pi-cast/db/auth-init"
import {
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  WEB_CLIENT_URL,
} from "./constants"

const authConfig: AuthConfig = {
  DATABASE_URL: process.env.DATABASE_URL!,
  WEB_CLIENT_URL,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS,
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE ?? "lax",
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED === "true",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
}

export const auth = createAuth(authConfig)
