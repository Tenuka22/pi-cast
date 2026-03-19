"use client"

import { ReactNode, createContext, useContext } from "react"
import { useSession } from "@/lib/auth-client"

type SessionContextType = {
  session: unknown
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType>({ session: undefined, isLoading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  
  return (
    <SessionContext.Provider value={{ session, isLoading: isPending }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useAuth() {
  return useContext(SessionContext)
}
