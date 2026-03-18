import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins/magic-link'

export function createAuth() {
  const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: {
      type: 'sqlite',
      url: process.env.DATABASE_URL ?? ':memory:',
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 100,
    },
    plugins: [
      magicLink({
        async sendMagicLink({ email, url, token }) {
          console.log('Magic link for', email, ':', url)
          console.log('Token:', token)
          // TODO: Implement actual email sending
        },
      }),
    ],
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  })

  return auth
}
