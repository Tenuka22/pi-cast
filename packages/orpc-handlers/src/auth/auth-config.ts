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

export function createAuth() {
  return betterAuth({
    usePlural: true,
    secret: ENV.BETTER_AUTH_SECRET,
    baseURL: ENV.WEB_CLIENT_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Placeholder for future user creation logic
            console.log("User created:", user.email)
          },
        },
      },
    },
    emailAndPassword: {
      enabled: false,
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP(data: { email: string; otp: string; type: string }) {
          console.log("OTP for", data.email, ":", data.otp, "Type:", data.type)
        },
        otpLength: 6,
        expiresIn: 60 * 5, // 5 minutes
      }),
      lastLoginMethod(),
      organization({
        allowUserToCreateOrganization: true,
      }),
      admin({}),
    ],
    socialProviders: {
      github: {
        clientId: ENV.GITHUB_CLIENT_ID,
        clientSecret: ENV.GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  })
}

export const auth = createAuth()
