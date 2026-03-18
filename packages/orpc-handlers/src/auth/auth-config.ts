import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { magicLink } from "better-auth/plugins"
import { db } from "@pi-cast/db"
import * as schema from "@pi-cast/db/schema"

export function createAuth() {
  return betterAuth({
    usePlural: true,
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 100,
    },
    plugins: [
      magicLink({
        async sendMagicLink(data: { email: string; url: string; token: string }) {
          console.log("Magic link for", data.email, ":", data.url)
          console.log("Token:", data.token)
          // TODO: Implement actual email sending
        },
      }),
    ],
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  })
}

export const auth = createAuth()
