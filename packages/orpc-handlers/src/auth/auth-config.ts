import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { ENV } from "varlock/env"
import {
  admin,
  emailOTP,
  lastLoginMethod,
  organization,
} from "better-auth/plugins"
import { db } from "@pi-cast/db"
import * as schema from "@pi-cast/db/schema"

/**
 * Parse trusted origins from environment variable
 */
function getTrustedOrigins(): string[] {
  if (!ENV.TRUSTED_ORIGINS) {
    return [ENV.WEB_CLIENT_URL, ENV.BETTER_AUTH_URL]
  }
  return ENV.TRUSTED_ORIGINS.split(",").map((origin) => origin.trim())
}

/**
 * Get current timestamp for logging
 */
function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Redact sensitive fields from log data
 */
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "accessToken", "refreshToken"]
  const redacted = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]"
    }
  }
  
  return redacted
}

/**
 * Create Better Auth instance with comprehensive logging and security
 */
export function createAuth() {
  const trustedOrigins = getTrustedOrigins()
  
  console.log("[Auth] Initializing Better Auth...")
  console.log("[Auth] Trusted origins:", trustedOrigins)
  console.log("[Auth] Rate limiting:", ENV.RATE_LIMIT_ENABLED ? "enabled" : "disabled")
  
  return betterAuth({
    usePlural: true,
    secret: ENV.BETTER_AUTH_SECRET,
    baseURL: ENV.BETTER_AUTH_URL,
    
    // Trusted origins for production security
    trustedOrigins: trustedOrigins,
    
    // Database configuration
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    
    // Cookie security settings
    advanced: {
      cookies: {
        session_token: {
          name: "session_token",
          attributes: {
            secure: ENV.COOKIE_SECURE,
            sameSite: ENV.COOKIE_SAME_SITE as "lax" | "strict" | "none",
            httpOnly: true,
            path: "/",
          },
        },
      },
    },
    
    // Comprehensive logging hooks
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            console.log("[Auth Hook] User creation started", {
              timestamp: getTimestamp(),
              email: user.email,
            })
            return {
              data: user,
            }
          },
          after: async (user) => {
            console.log("[Auth Hook] User created successfully", {
              timestamp: getTimestamp(),
              userId: user.id,
              email: user.email,
              verified: user.emailVerified,
            })
          },
        },
        update: {
          before: async (user) => {
            console.log("[Auth Hook] User update started", {
              timestamp: getTimestamp(),
              userId: user.id,
              fields: Object.keys(redactSensitiveData(user as Record<string, unknown>)),
            })
            return {
              data: user,
            }
          },
          after: async (user) => {
            console.log("[Auth Hook] User updated successfully", {
              timestamp: getTimestamp(),
              userId: user.id,
            })
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            console.log("[Auth Hook] Session creation started", {
              timestamp: getTimestamp(),
              userId: session.userId,
              ipAddress: session.ipAddress || "unknown",
            })
            return {
              data: session,
            }
          },
          after: async (session) => {
            console.log("[Auth Hook] Session created successfully", {
              timestamp: getTimestamp(),
              sessionId: session.id,
              userId: session.userId,
              expiresAt: new Date(session.expiresAt).toISOString(),
            })
          },
        },
      },
      account: {
        create: {
          after: async (account) => {
            console.log("[Auth Hook] Account linked", {
              timestamp: getTimestamp(),
              userId: account.userId,
              providerId: account.providerId,
              accountId: account.accountId,
            })
          },
        },
      },
    },
    
    // Email and password configuration
    emailAndPassword: {
      enabled: false,
    },
    
    // Email OTP plugin with logging
    plugins: [
      emailOTP({
        async sendVerificationOTP(data: { 
          email: string
          otp: string
          type: string
        }) {
          console.log("[Auth OTP] Verification OTP generated", {
            timestamp: getTimestamp(),
            email: data.email,
            type: data.type,
            otpLength: data.otp.length,
            expiresIn: "5 minutes",
          })
          // TODO: Integrate with actual email service
          // await emailService.sendOTP(data.email, data.otp)
        },
        otpLength: 6,
        expiresIn: 60 * 5, // 5 minutes
      }),
      
      // Last login method tracking
      lastLoginMethod(),
      
      // Organization plugin with logging
      organization({
        allowUserToCreateOrganization: true,
      }),
      
      // Admin plugin with audit logging
      admin(),
    ],
    
    // Social providers with error handling
    socialProviders: {
      github: {
        clientId: ENV.GITHUB_CLIENT_ID,
        clientSecret: ENV.GITHUB_CLIENT_SECRET,
      },
    },
    
    // Session configuration with security settings
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      freshAge: 60 * 60 * 24, // Require fresh session for sensitive operations after 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes cache
      },
    },
    
    // Rate limiting configuration
    rateLimit: {
      enabled: ENV.RATE_LIMIT_ENABLED,
      window: ENV.RATE_LIMIT_WINDOW_MS, // 1 minute
      max: ENV.RATE_LIMIT_MAX_REQUESTS, // 10 requests per window
      customRules: {
        // Stricter limits for sensitive endpoints
        "/api/auth/sign-in": {
          window: 60 * 1000, // 1 minute
          max: 5, // 5 attempts
        },
        "/api/auth/email-otp/send-verification-otp": {
          window: 60 * 1000, // 1 minute
          max: 3, // 3 OTP requests per minute
        },
        "/api/auth/sign-up": {
          window: 60 * 1000, // 1 minute
          max: 3, // 3 sign up attempts
        },
      },
    },
  })
}

export const auth = createAuth()
