'use client'

import { useCallback, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function useAuth() {
  const [session, setSession] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const fetchSession = useCallback(async () => {
    try {
      const sessionData = await authClient.getSession()
      setSession(sessionData)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authClient.signIn({ email, password })
    setSession(result)
    return result
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const result = await authClient.signUp({ email, password, name })
    setSession(result)
    return result
  }, [])

  const signOut = useCallback(async () => {
    await authClient.signOut()
    setSession(null)
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    const result = await authClient.sendMagicLink({ email })
    return result
  }, [])

  const verifyMagicLink = useCallback(async (token: string) => {
    const result = await authClient.verifyMagicLink({ token })
    setSession(result)
    return result
  }, [])

  const getGitHubAuthUrl = useCallback(async () => {
    const result = await authClient.getGitHubAuthUrl()
    return result
  }, [])

  return {
    session,
    isLoading,
    error,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
    verifyMagicLink,
    getGitHubAuthUrl,
    refetch: fetchSession,
  }
}
