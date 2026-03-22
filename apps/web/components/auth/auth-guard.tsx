import { ReactNode } from "react"
import Link from "next/link"
import { authServerClient } from "@pi-cast/auth-server"
import { Button } from "@workspace/ui/components/button"

interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
}

export async function AuthGuard({
  children,
  redirectTo = "/login",
}: AuthGuardProps) {
  const userSession = await authServerClient.getSession()
  const session = userSession.data?.session
  const user = userSession.data?.user

  if (!session || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          You need to be logged in to access this page.
        </p>

        <Button render={<Link href={redirectTo}>Go to Login</Link>} />
      </div>
    )
  }

  return <>{children}</>
}
