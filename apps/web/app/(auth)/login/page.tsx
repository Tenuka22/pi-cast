"use client"

import { useState } from "react"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GithubIcon,
  MailIcon,
  ShieldCheck,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import {
  signIn,
  sendVerificationOtp,
  signInWithOTP,
} from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      await sendVerificationOtp({ email, type: "sign-in" })
      setMessage("Verification code sent! Check your email.")
      setStep("otp")
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to send code. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInWithOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    const { error, data } = await signInWithOTP({
      email,
      otp,
      callbackURL: "/dashboard",
    })

    if (error) {
      setError(error.message || "Invalid code. Please try again.")
      setIsLoading(false)
    } else if (data) {
      // Success - clear loading and redirect
      setIsLoading(false)
      setMessage("Sign in successful! Redirecting...")
      router.push("/dashboard")
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      await sendVerificationOtp({ email, type: "sign-in" })
      setMessage("Verification code resent! Check your email.")
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend code. Please try again."
      setError(errorMessage)
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

  const handleBackToEmail = () => {
    setStep("email")
    setOtp("")
    setError("")
    setMessage("")
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-2 flex justify-center">
            <Image
              src="/logo.jpg"
              alt="Pi-Cast"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a verification code"
              : "Enter the 6-digit code sent to your email"}
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

          {step === "email" ? (
            <form
              onSubmit={(e) => void handleSendCode(e)}
              className="space-y-4"
            >
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
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <HugeiconsIcon icon={MailIcon} size={16} className="mr-2" />
                {isLoading ? "Sending..." : "Send Code"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={(e) => void handleSignInWithOTP(e)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    if (value.length <= 6) {
                      setOtp(value)
                    }
                  }}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                  className="text-center font-mono text-lg tracking-[0.5em]"
                />
              </div>
              <div className="text-center text-xs text-muted-foreground">
                Code sent to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <HugeiconsIcon icon={ShieldCheck} size={16} className="mr-2" />
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleBackToEmail()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Change Email
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleResendCode()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={16}
                    className="mr-1"
                  />
                  Resend
                </Button>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => void handleGitHubSignIn()}
            disabled={isLoading}
          >
            <HugeiconsIcon icon={GithubIcon} size={16} className="mr-2" />
            GitHub
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            A verification code will be sent to your email
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
