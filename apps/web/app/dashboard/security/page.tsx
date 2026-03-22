import { AuthGuard } from "@/components/auth/auth-guard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldBanIcon,
  LockKeyIcon,
  Key01Icon,
} from "@hugeicons/core-free-icons"
import { Header } from "./header"

export default function SecurityPage() {
  return (
    <AuthGuard>
      <SecurityContent />
    </AuthGuard>
  )
}

function SecurityContent() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <TwoFactorInfoCard />
      </main>
    </div>
  )
}

function TwoFactorInfoCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={ShieldBanIcon}
              className="h-6 w-6 text-muted-foreground"
            />
          </div>
          <div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              2FA is unavailable with your current authentication method
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Password Authentication Required
          </p>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            Two-factor authentication requires password-based authentication to be enabled.
            Since you are using magic link authentication, 2FA is not available for your account.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            To enable two-factor authentication, you would need to:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Set up a password for your account</li>
            <li>Use password-based sign-in instead of magic links</li>
            <li>Then navigate to this page to configure 2FA</li>
          </ul>
        </div>

        <div className="flex items-center gap-2 rounded-md border bg-muted p-4">
          <HugeiconsIcon icon={LockKeyIcon} className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Why is this required?</p>
            <p className="text-xs">
              2FA adds an extra verification step during sign-in. With magic link authentication,
              the email link itself serves as the verification method, making traditional 2FA incompatible.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border bg-muted p-4">
          <HugeiconsIcon icon={Key01Icon} className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Alternative Security Options</p>
            <p className="text-xs">
              Magic link authentication provides strong security through email verification.
              Ensure your email account is secured with 2FA for maximum protection.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
