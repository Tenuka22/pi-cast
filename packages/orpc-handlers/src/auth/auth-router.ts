import { os } from '@orpc/server'
import { createAuth } from './auth-config'
import {
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  verifyMagicLinkSchema,
} from '../schemas/auth-schemas'

const auth = createAuth()

export const authRouter = os.router({
  signIn: os
    .input(signInSchema)
    .handler(async ({ input }) => {
      const session = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
        },
      })

      return {
        session,
        user: session.user,
      }
    }),

  signUp: os
    .input(signUpSchema)
    .handler(async ({ input }) => {
      const session = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
        },
      })

      return {
        session,
        user: session.user,
      }
    }),

  sendMagicLink: os
    .input(magicLinkSchema)
    .handler(async ({ input }) => {
      await auth.api.signInMagicLink({
        body: {
          email: input.email,
        },
        headers: new Headers(),
      })

      return { success: true }
    }),

  verifyMagicLink: os
    .input(verifyMagicLinkSchema)
    .handler(async ({ input }) => {
      const result = await auth.api.magicLinkVerify({
        query: {
          token: input.token,
        },
        headers: new Headers(),
      })

      return {
        session: result,
        user: result.user,
      }
    }),

  getSession: os.handler(async () => {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    return session
  }),

  signOut: os.handler(async () => {
    await auth.api.signOut({
      headers: new Headers(),
    })

    return { success: true }
  }),

  getGitHubAuthUrl: os.handler(async () => {
    const url = await auth.api.signInSocial({
      body: {
        provider: 'github',
        callbackURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
      },
    })

    return { url }
  }),
})

export type AuthRouter = typeof authRouter
