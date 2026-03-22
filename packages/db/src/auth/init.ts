import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { BETTER_AUTH_COOKIE_PREFIX } from "@pi-cast/auth-client/config"
import {
  admin,
  emailOTP,
  lastLoginMethod,
  organization,
} from "better-auth/plugins"
import { createDb } from "../index"
import { user, session, account, verification, userProfile } from "../schema"
import { generateUniqueUsername } from "../username"

export interface AuthConfig {
  WEB_CLIENT_URL: string
  DATABASE_URL: string
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  TRUSTED_ORIGINS?: string
  COOKIE_SECURE?: boolean
  COOKIE_SAME_SITE?: string
  RATE_LIMIT_ENABLED?: boolean
  RATE_LIMIT_WINDOW_MS?: number
  RATE_LIMIT_MAX_REQUESTS?: number
}

export type Auth = ReturnType<typeof createAuth>

/**
 * Create Better Auth instance with comprehensive logging and security
 */
export function createAuth(config: AuthConfig) {
  const db = createDb(config.DATABASE_URL)

  const {
    WEB_CLIENT_URL,
    BETTER_AUTH_URL,
    TRUSTED_ORIGINS,
    BETTER_AUTH_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    COOKIE_SECURE,
    COOKIE_SAME_SITE,
    RATE_LIMIT_ENABLED,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS,
  } = config

  function getTrustedOrigins(): string[] {
    if (!TRUSTED_ORIGINS) {
      return [WEB_CLIENT_URL, BETTER_AUTH_URL]
    }
    return TRUSTED_ORIGINS.split(",").map((origin) => origin.trim())
  }

  function parseSameSite(value: string): "lax" | "strict" | "none" {
    const lower = value.toLowerCase()
    if (lower === "strict") return "strict"
    if (lower === "none") return "none"
    return "lax"
  }

  const ADMIN_EMAIL = "tenukaomaljith2009@gmail.com"

  return betterAuth({
    usePlural: true,
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    trustedOrigins: getTrustedOrigins(),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    advanced: {
      cookiePrefix: BETTER_AUTH_COOKIE_PREFIX,
      cookies: {
        session_token: {
          attributes: {
            secure: Boolean(COOKIE_SECURE),
            sameSite: parseSameSite(COOKIE_SAME_SITE ?? "lax"),
            httpOnly: true,
            path: "/",
          },
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 60 * 5, // 5 minutes
        sendVerificationOTP: async (data: {
          email: string
          otp: string
          type: string
        }) => {
          await console.log("[Auth OTP] Verification OTP generated", {
            email: data.email,
            type: data.type,
            otpLength: data.otp.length,
            expiresIn: "5 minutes",
            otp: data.otp,
          })
        },
      }),
      lastLoginMethod(),
      organization({ allowUserToCreateOrganization: true }),
      admin(),
    ],
    socialProviders: {
      github: {
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    rateLimit: {
      enabled: RATE_LIMIT_ENABLED,
      window: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
    },

    databaseHooks: {
      user: {
        create: {
          before: async (userData) => {
            const isAdminEmail = userData.email === ADMIN_EMAIL

            return {
              data: {
                ...userData,
                role: isAdminEmail ? "admin" : userData.role,
              },
            }
          },
          after: async (user) => {
            if (user.email === ADMIN_EMAIL) {
              console.log(`[Auth Hook] Admin user created: ${ADMIN_EMAIL}`)
            }

            try {
              const username = await generateUniqueUsername(db, user.email)
              await db.insert(userProfile).values({
                userId: user.id,
                username,
              })
              console.log(
                `[Auth Hook] Profile created for user ${user.id} with username: ${username}`
              )
            } catch (error) {
              console.error("[Auth Hook] Failed to create user profile:", error)
            }
          },
        },
      },
    },
  })
}
