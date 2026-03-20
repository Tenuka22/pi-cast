/**
 * Web App Auth Client
 * 
 * This file re-exports the auth client from @pi-cast/auth-client
 * and adds app-specific auth error handling utilities.
 */

"use client"

import type { AuthError } from "@pi-cast/orpc-handlers"
import { toApiError, getErrorMessage, ERROR_CODES } from "@pi-cast/orpc-handlers"
import {
  authClient,
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  updateUser,
  changeEmail,
  deleteUser,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  organization,
  sendVerificationOtp,
  signInWithOTP,
} from "@pi-cast/auth-client"

export {
  authClient,
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  updateUser,
  changeEmail,
  deleteUser,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  organization,
  sendVerificationOtp,
  signInWithOTP,
}

export async function handleAuthError<T>(
  fn: () => Promise<T>,
  options?: {
    onError?: (error: AuthError) => void
    type?: AuthError["type"]
  }
): Promise<{ data: T | null; error: AuthError | null }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (error) {
    const authError: AuthError = {
      ...toApiError(error),
      type: options?.type,
    }
    console.error("[Auth Error]", authError)
    options?.onError?.(authError)
    return { data: null, error: authError }
  }
}

export async function safeSignIn(
  email: string,
  password: string,
  onError?: (error: AuthError) => void
) {
  return handleAuthError(
    async () => {
      const result = await signIn.email({ email, password })
      if (!result.data) throw new Error("Sign in failed")
      return result.data
    },
    { onError, type: "sign_in" }
  )
}

export async function safeSendVerificationOtp(
  email: string,
  otp: string,
  onError?: (error: AuthError) => void
) {
  return handleAuthError(
    async () => {
      const result = await sendVerificationOtp({ email, type: "sign-in" })
      if (!result.data) throw new Error("Failed to send OTP")
      return result.data
    },
    { onError, type: "otp" }
  )
}

export async function safeSignInWithOTP(
  email: string,
  otp: string,
  onError?: (error: AuthError) => void
) {
  return handleAuthError(
    async () => {
      const result = await signInWithOTP({ email, otp })
      if (!result.data) throw new Error("OTP sign in failed")
      return result.data
    },
    { onError, type: "sign_in" }
  )
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  return getErrorMessage(error, fallback)
}

export function isAuthErrorCode(
  error: unknown,
  code: keyof typeof ERROR_CODES
): boolean {
  return toApiError(error).code === ERROR_CODES[code]
}
