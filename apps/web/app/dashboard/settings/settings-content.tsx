"use client"

import { useState, useCallback, useEffect } from "react"
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
import { requestCreatorRole } from "@/app/actions/profile-actions"

type Tab = "profile" | "account" | "sessions" | "creator"

export function SettingsContent() {
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

      <main className="container mx-auto space-y-6 p-6">
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
          <Button
            variant={activeTab === "creator" ? "default" : "ghost"}
            onClick={() => setActiveTab("creator")}
            className="gap-2"
          >
            <HugeiconsIcon icon={AiUserIcon} />
            Creator
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "account" && <AccountTab />}
        {activeTab === "sessions" && <SessionsTab />}
        {activeTab === "creator" && <CreatorTab />}
      </main>
    </div>
  )
}

function ProfileTab() {
  const { data: session, refetch } = authClient.useSession()

  const handleSaveProfile = async (data: {
    bio?: string
    location?: string
    website?: string
    image?: string
  }) => {
    try {
      await updateUser({
        name: session?.user?.name,
        image: data.image || undefined,
      })

      await refetch()
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update profile")
    }
  }

  if (!session?.user) {
    return <LoadingSpinner />
  }

  return (
    <ProfileEditor
      initialData={{
        name: session.user.name || "",
        email: session.user.email,
        bio: null,
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
      setSuccess(
        "Email change initiated. Please check your inbox to verify the new email."
      )
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
                <p className="mt-1 text-xs text-muted-foreground">
                  This will permanently delete your account and all associated
                  data.
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
                  disabled={
                    isDeleting || deleteConfirmText !== session?.user?.email
                  }
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
    const sessionsToRevoke =
      sessions?.filter((s) => s.id !== currentSessionId) || []

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
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
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
              <HugeiconsIcon
                icon={FingerPrintIcon}
                className="mb-4 h-12 w-12 text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                No active sessions found
              </p>
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
                          Last active:{" "}
                          {sessionItem.lastActiveAt
                            ? formatDate(sessionItem.lastActiveAt)
                            : "N/A"}
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

function CreatorTab() {
  const { data: session, refetch } = authClient.useSession()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const userRole = (session?.user as { role?: string } | undefined)?.role
  const isCreator = userRole === "creator" || userRole === "admin"
  const isAdmin = userRole === "admin"

  const handleBecomeCreator = async () => {
    setIsUpgrading(true)
    setMessage(null)

    try {
      const result = await requestCreatorRole()

      if (!result.success) {
        throw new Error(result.error || "Failed to become a creator")
      }

      if (result.data?.success) {
        setMessage({
          type: "success",
          text: result.data.message || "Successfully became a creator!",
        })
        await refetch()
      } else {
        setMessage({
          type: "error",
          text: "Failed to become a creator",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to become a creator",
      })
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Status</CardTitle>
          <CardDescription>
            Manage your creator privileges and access recording features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreator ? (
            <div className="space-y-4">
              <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  ✓ You are a {isAdmin ? "Administrator" : "Creator"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAdmin
                    ? "You have full administrative access to all features."
                    : "You can create and record lessons, upload content, and create organizations."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Recording</h4>
                  <p className="text-sm text-muted-foreground">
                    Create interactive lessons with audio and event recording
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Organizations</h4>
                  <p className="text-sm text-muted-foreground">
                    Create and manage organizations for your team or school
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Publishing</h4>
                  <p className="text-sm text-muted-foreground">
                    Publish lessons for students to discover and learn
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Track views, completions, and student engagement
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  ⚡ Student Account
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upgrade to creator to unlock lesson creation and recording
                  features.
                </p>
              </div>

              {message && (
                <div
                  className={`rounded-md border px-4 py-3 ${
                    message.type === "success"
                      ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300"
                      : "border-destructive/50 bg-destructive/10 text-destructive"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                onClick={() => void handleBecomeCreator()}
                disabled={isUpgrading}
                className="w-full gap-2"
                size="lg"
              >
                {isUpgrading ? (
                  <>
                    <div className="h-4 w-4">
                      <LoadingSpinner />
                    </div>
                    Upgrading...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={AiUserIcon} />
                    Become a Creator
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Free upgrade • Instant activation • Full access to creation
                tools
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Creators Can Do</CardTitle>
          <CardDescription>
            Unlock powerful teaching and content creation tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Record interactive lessons with synchronized audio and events
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Create organizations and invite team members
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Publish lessons to the platform for students
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Use the full canvas workspace with all block types
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Create bookmarks and structured lesson content
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Access analytics and student engagement metrics
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
