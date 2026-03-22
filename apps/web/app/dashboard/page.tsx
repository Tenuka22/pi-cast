"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { UserNav } from "@/components/auth/user-nav"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Pi-Cast"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg"
            />
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/canvas")}>
              Canvas
            </Button>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>Your session information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{session.user.name || "N/A"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Verified:</span>
                <span className="font-medium">{session.user.emailVerified ? "Yes" : "No"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Image:</span>
                <span className="font-medium">{session.user.image ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => void handleSignOut()}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
