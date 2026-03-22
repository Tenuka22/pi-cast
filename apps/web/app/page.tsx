"use client"

import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import Image from "next/image"

export default function Page() {
  const { data, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Pi-Cast"
            width={48}
            height={48}
            className="h-12 w-12 rounded-lg"
          />
          <h1 className="text-2xl font-bold">Pi-Cast</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/canvas">
            <Button variant="outline">Canvas</Button>
          </Link>
          {data?.user ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <div>
            <h1 className="font-medium">Welcome to Pi-Cast!</h1>
            <p>Your authentication-powered application.</p>
          </div>

          {data?.user ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">You are signed in as:</p>
                <p className="text-muted-foreground">
                  {data?.user?.email}
                </p>
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
