"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { HugeiconsIcon } from '@hugeicons/react'
import { GithubIcon } from '@hugeicons/core-free-icons'
import { signIn } from "@/lib/auth-client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      await signIn.magicLink({ email })
      setMessage("Magic link sent! Check your email.")
      router.push("/magic-link-sent")
    } catch {
      setError("Failed to send magic link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    setError("")
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      })
    } catch {
      setError("Failed to sign in with GitHub. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Sign in to your account using magic link or GitHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGitHubSignIn}
            disabled={isLoading}
          >
            <HugeiconsIcon icon={GithubIcon} size={16} className="mr-2" />
            GitHub
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            Magic links work for both new and existing accounts
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
