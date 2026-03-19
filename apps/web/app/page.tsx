import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { getSession } from "@/lib/auth-client"
import { UserNav } from "@/components/auth/user-nav"

export default async function Page() {
  const session = await getSession()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pi-Cast</h1>
        {session.data?.user ? (
          <UserNav />
        ) : (
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <div>
            <h1 className="font-medium">Welcome to Pi-Cast!</h1>
            <p>Your authentication-powered application.</p>
          </div>

          {session.data?.user ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">You are signed in as:</p>
                <p className="text-muted-foreground">
                  {session.data?.user?.email}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                Sign in to access your dashboard and manage your organizations.
              </p>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          )}

          <div className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>
        </div>
      </main>
    </div>
  )
}
