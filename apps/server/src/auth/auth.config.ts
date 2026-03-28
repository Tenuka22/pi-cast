import { drizzle } from "drizzle-orm/d1"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { anonymous, openAPI, admin } from "better-auth/plugins"
import { emailOTP } from "better-auth/plugins/email-otp"
import * as schema from "../db/schema"
import { withCloudflare } from "better-auth-cloudflare"
import {
  ADMIN_EMAIL,
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_COOKIE_PREFIX,
} from "@pi-cast/constants"
import { ENV } from "varlock/env"
import type { KVNamespace, D1Database } from "@cloudflare/workers-types"

export const createAuth = (
  env?: CloudflareBindings,
  cf?: IncomingRequestCfProperties
) => {
  const db = env
    ? drizzle(env.DATABASE, { schema, logger: true })
    : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      drizzle({} as unknown as D1Database, { schema, logger: true })

  return betterAuth({
    baseURL: ENV.SERVER_URL,
    basePath: BETTER_AUTH_BASE_PATH,

    trustedOrigins: [ENV.SERVER_URL, ENV.WEB_CLIENT_URL],
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: cf || {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/consistent-type-assertions
        d1: (env
          ? {
              db,
              options: {
                usePlural: true,
                debugLogs: true,
              },
            }
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            undefined) as any,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        kv: env?.AUTH_KV as unknown as KVNamespace,
      },
      {
        emailAndPassword: {
          enabled: true,
        },
        plugins: [
          anonymous(),
          openAPI(),
          admin({
            adminUserIds: [], // Set admin user IDs here or use the admin role
          }),
          emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
              // TODO: Implement email sending (e.g., via SendGrid, Resend, etc.)
              console.log(`Sending OTP ${otp} to ${email} for ${type}`)
            },
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            disableSignUp: false, // Allow sign up via OTP
          }),
        ],
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
            },
          },
        },
        rateLimit: {
          enabled: true,
          window: 60, // Minimum KV TTL is 60s
          max: 100, // reqs/window
          customRules: {
            // https://github.com/better-auth/better-auth/issues/5452
            "/sign-in/email": {
              window: 60,
              max: 100,
            },
            "/sign-in/social": {
              window: 60,
              max: 100,
            },
            "/email-otp/send-verification-otp": {
              window: 60,
              max: 5, // Limit OTP requests
            },
            "/email-otp/sign-in": {
              window: 60,
              max: 10, // Limit OTP verification attempts
            },
          },
        },
      }
    ),
    ...(env
      ? {}
      : {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          database: drizzleAdapter({} as unknown as D1Database, {
            provider: "sqlite",
            usePlural: true,
            debugLogs: true,
          }),
        }),
    advanced: {
      cookiePrefix: BETTER_AUTH_COOKIE_PREFIX,
      trustedProxyHeaders: true,
      cookieOptions: {
        path: "/",
        sameSite: "None",
        secure: true,
      },
    },
  })
}

export const auth = createAuth()
