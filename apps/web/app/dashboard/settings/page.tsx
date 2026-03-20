"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { UserNav } from "@/components/auth/user-nav"
import {
  authClient,
  updateUser,
  changeEmail,
  deleteUser,
  listSessions,
  revokeSession,
} from "@/lib/auth/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LaptopIcon,
  MobileSecurityIcon,
  WasteIcon,
  AiUserIcon,
  LockKeyIcon,
  FingerPrintIcon,
} from "@hugeicons/core-free-icons"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProfileEditor } from "@/components/profile/profile-editor"

type Tab = "profile" | "account" | "sessions"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}

function SettingsContent() {
  const { data: session } = authClient.useSession()
  const [activeTab, setActiveTab] = useState<Tab>("profile")

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold">Settings</h1>
          <UserNav />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            onClick={() => setActiveTab("profile")}
            className="gap-2"
          >
            <HugeiconsIcon icon={AiUserIcon} />
            Profile
          </Button>
          <Button
            variant={activeTab === "account" ? "default" : "ghost"}
            onClick={() => setActiveTab("account")}
            className="gap-2"
          >
            <HugeiconsIcon icon={LockKeyIcon} />
            Account
          </Button>
          <Button
            variant={activeTab === "sessions" ? "default" : "ghost"}
            onClick={() => setActiveTab("sessions")}
            className="gap-2"
          >
            <HugeiconsIcon icon={FingerPrintIcon} />
            Sessions
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "account" && <AccountTab />}
        {activeTab === "sessions" && <SessionsTab />}
      </main>
    </div>
  )
}

function ProfileTab() {
  const { data: session, refetch } = authClient.useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveProfile = async (data: { bio?: string; location?: string; website?: string; image?: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      // Update name and image via updateUser
      await updateUser({
        name: session?.user?.name,
        image: data.image || undefined,
      })
      
      // TODO: Call profile update API for bio, location, website
      // await profileUpdateMyProfile({ bio: data.bio, location: data.location, website: data.website })
      
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return <LoadingSpinner />
  }

  return (
    <ProfileEditor
      initialData={{
        name: session.user.name || '',
        email: session.user.email,
        bio: null, // TODO: Get from profile
        location: null,
        website: null,
        image: session.user.image,
      }}
      onSave={handleSaveProfile}
    />
  )
}

function AccountTab() {
  const { data: session } = authClient.useSession()
  const [email, setEmail] = useState(session?.user?.email || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await changeEmail({ newEmail: email })
      setSuccess("Email change initiated. Please check your inbox to verify the new email.")
    } catch {
      setError("Failed to change email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== session?.user?.email) {
      setError("Email does not match")
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteUser()
      router.push("/")
    } catch {
      setError("Failed to delete account. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Change Email Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>Update your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => void handleEmailChange(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">New Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="newemail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Changing..." : "Change Email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2"
            >
              <HugeiconsIcon icon={WasteIcon} />
              Delete Account
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-medium text-destructive">
                  This action cannot be undone
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This will permanently delete your account and all associated data.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete">
                  Type &quot;{session?.user?.email}&quot; to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  type="text"
                  placeholder={session?.user?.email}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText("")
                    setError(null)
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleDeleteAccount()}
                  disabled={isDeleting || deleteConfirmText !== session?.user?.email}
                  className="gap-2"
                >
                  <HugeiconsIcon icon={WasteIcon} />
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SessionsTab() {
  const { data: session } = authClient.useSession()
  interface SessionItem {
    id: string
    userAgent?: string | null
    lastActiveAt?: string | number | Date
    ipAddress?: string | null
  }
  const [sessions, setSessions] = useState<SessionItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await listSessions()
      if (response.data && Array.isArray(response.data)) {
        setSessions(response.data)
      }
    } catch {
      setError("Failed to load sessions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId)
    try {
      await revokeSession({ token: sessionId })
      await fetchSessions()
    } catch {
      setError("Failed to revoke session")
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAllOtherSessions = async () => {
    const currentSessionId = session?.session?.id
    const sessionsToRevoke = sessions?.filter((s) => s.id !== currentSessionId) || []

    for (const sessionToRevoke of sessionsToRevoke) {
      try {
        await revokeSession({ token: sessionToRevoke.id })
      } catch {
        // Continue revoking other sessions even if one fails
      }
    }
    await fetchSessions()
  }

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile")) {
      return MobileSecurityIcon
    }
    return LaptopIcon
  }

  const getDeviceName = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile")) {
      return "Mobile Device"
    }
    return "Desktop"
  }

  const formatDate = (date: string | number | Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const currentSessionId = session?.session?.id

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </div>
            {sessions && sessions.length > 1 && (
              <Button
                variant="outline"
                onClick={() => void handleRevokeAllOtherSessions()}
                className="gap-2"
              >
                Sign Out All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!sessions || sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HugeiconsIcon icon={FingerPrintIcon} className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sessionItem) => {
                const isCurrentSession = sessionItem.id === currentSessionId
                const deviceIcon = getDeviceIcon(sessionItem.userAgent || "")

                return (
                  <div
                    key={sessionItem.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      isCurrentSession ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <HugeiconsIcon icon={deviceIcon} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {getDeviceName(sessionItem.userAgent || "")}
                          </p>
                          {isCurrentSession && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last active: {sessionItem.lastActiveAt ? formatDate(sessionItem.lastActiveAt) : "N/A"}
                        </p>
                        {sessionItem.ipAddress && (
                          <p className="text-xs text-muted-foreground">
                            IP: {sessionItem.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCurrentSession && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRevokeSession(sessionItem.id)}
                        disabled={revokingId === sessionItem.id}
                        className="gap-2"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


