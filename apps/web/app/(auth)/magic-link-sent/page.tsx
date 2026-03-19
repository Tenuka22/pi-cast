import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function MagicLinkSentPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a magic link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Click the link in your email to sign in to your account.
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Didn&apos;t receive the email?</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
