"use client"

import * as React from "react"

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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { authClient } from "@/lib/auth/auth-client"
import { useUserRole } from "@/hooks/use-user-role"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import Link from "next/link"

// Types
interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  metadata?: string | null
}

interface Member {
  id: string
  userId: string
  organizationId: string
  role: string
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface Invitation {
  id: string
  organizationId: string
  email: string
  role?: string | null
  status: string
  expiresAt: Date
  createdAt: Date
  inviterId: string
}

interface AuthGuardProps {
  children: React.ReactNode
}

// Type guard helpers for API responses
function isOrganizationArray(value: unknown): value is Organization[] {
  return Array.isArray(value)
}

function isMemberArray(value: unknown): value is Member[] {
  return Array.isArray(value)
}

function isInvitationArray(value: unknown): value is Invitation[] {
  return Array.isArray(value)
}

// AuthGuard Component
function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  )

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: session } = await authClient.getSession()
      setIsAuthenticated(!!session)
    }
    void checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Member Row Component
function MemberRow({
  member,
  isOwner,
  onRemove,
  onUpdateRole,
}: {
  member: Member
  isOwner: boolean
  onRemove: (memberId: string) => Promise<void>
  onUpdateRole: (memberId: string, role: "admin" | "member" | "owner") => Promise<void>
}) {
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleRoleChange = async (newRole: "admin" | "member" | "owner") => {
    setIsUpdating(true)
    try {
      await onUpdateRole(member.id, newRole)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async () => {
    setIsUpdating(true)
    try {
      await onRemove(member.id)
    } finally {
      setIsUpdating(false)
    }
  }

  const roleColors: Record<string, string> = {
    owner:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    member: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarImage src={member.user.image || undefined} />
          <AvatarFallback>
            {member.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-sm font-medium">{member.user.name}</div>
          <div className="text-xs text-muted-foreground">
            {member.user.email}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[member.role] || roleColors.member}`}
        >
          {member.role}
        </span>
        {isOwner && member.role !== "owner" && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" disabled={isUpdating}>
                Change Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void handleRoleChange("admin")}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleRoleChange("member")}>
                Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {isOwner && member.role !== "owner" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleRemove()}
            disabled={isUpdating}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

// Invitation Row Component
function InvitationRow({
  invitation,
  onCancel,
}: {
  invitation: Invitation
  onCancel: (invitationId: string) => Promise<void>
}) {
  const [isCancelling, setIsCancelling] = React.useState(false)

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await onCancel(invitation.id)
    } finally {
      setIsCancelling(false)
    }
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium">{invitation.email}</div>
        <div className="text-xs text-muted-foreground">
          Role: {invitation.role || "member"} •{" "}
          {isExpired ? (
            <span className="text-red-500">Expired</span>
          ) : (
            <>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            invitation.status === "pending"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              : invitation.status === "accepted"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }`}
        >
          {invitation.status}
        </span>
        {!isExpired && invitation.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleCancel()}
            disabled={isCancelling}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

// Organization Card Component
function OrganizationCard({
  organization,
  members,
  invitations,
  isOwner,
  onRemoveMember,
  onUpdateMemberRole,
  onCancelInvitation,
  onInviteMember,
}: {
  organization: Organization
  members: Member[]
  invitations: Invitation[]
  isOwner: boolean
  onRemoveMember: (memberId: string) => Promise<void>
  onUpdateMemberRole: (memberId: string, role: "admin" | "member" | "owner") => Promise<void>
  onCancelInvitation: (invitationId: string) => Promise<void>
  onInviteMember: (email: string, role: "admin" | "member" | "owner") => Promise<void>
}) {
  const [showInviteForm, setShowInviteForm] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<"admin" | "member" | "owner">("member")
  const [isInviting, setIsInviting] = React.useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    try {
      await onInviteMember(inviteEmail, inviteRole)
      setInviteEmail("")
      setInviteRole("member")
      setShowInviteForm(false)
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{organization.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="font-mono text-xs">/{organization.slug}</span>
              <span className="text-muted-foreground">•</span>
              <span>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </CardDescription>
          </div>
          {organization.logo && (
            <Avatar>
              <AvatarImage src={organization.logo} />
              <AvatarFallback>
                {organization.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Members Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Members</h3>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteForm(!showInviteForm)}
              >
                {showInviteForm ? "Cancel" : "Invite Member"}
              </Button>
            )}
          </div>

          {/* Invite Form */}
          {showInviteForm && (
            <form
              onSubmit={(e) => void handleInvite(e)}
              className="mb-4 flex gap-2 rounded-md border p-3"
            >
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'admin' || value === 'member' || value === 'owner') {
                    setInviteRole(value);
                  }
                }}
                className="h-7 rounded-md border border-input bg-input/20 px-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" size="sm" disabled={isInviting}>
                {isInviting ? "Sending..." : "Send"}
              </Button>
            </form>
          )}

          <div className="divide-y">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isOwner={isOwner}
                onRemove={onRemoveMember}
                onUpdateRole={onUpdateMemberRole}
              />
            ))}
          </div>
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold">Pending Invitations</h3>
            <div className="divide-y">
              {invitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={onCancelInvitation}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Organizations Page Component
function OrganizationsPageContent() {
  const { canCreateOrg, isCreator, isAdmin } = useUserRole()
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [membersByOrg, setMembersByOrg] = React.useState<
    Record<string, Member[]>
  >({})
  const [invitationsByOrg, setInvitationsByOrg] = React.useState<
    Record<string, Invitation[]>
  >({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCreating, setIsCreating] = React.useState(false)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState("")
  const [newOrgSlug, setNewOrgSlug] = React.useState("")

  // Load organizations
  const loadOrganizations = React.useCallback(async () => {
    try {
      const { data: orgs } = await authClient.organization.list()
      if (orgs && isOrganizationArray(orgs)) {
        setOrganizations(orgs)

        // Load members and invitations for each organization using getFullOrganization
        const membersMap: Record<string, Member[]> = {}
        const invitationsMap: Record<string, Invitation[]> = {}

        for (const org of orgs) {
          const { data: fullOrg } =
            await authClient.organization.getFullOrganization({
              query: { organizationId: org.id },
            })

          if (fullOrg && isMemberArray(fullOrg.members) && isInvitationArray(fullOrg.invitations)) {
            membersMap[org.id] = fullOrg.members
            invitationsMap[org.id] = fullOrg.invitations
          } else {
            membersMap[org.id] = []
            invitationsMap[org.id] = []
          }
        }

        setMembersByOrg(membersMap)
        setInvitationsByOrg(invitationsMap)
      }
    } catch (error) {
      console.error("Failed to load organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  // Create organization
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const { data, error } = await authClient.organization.create({
        name: newOrgName,
        slug: newOrgSlug || newOrgName.toLowerCase().replace(/\s+/g, "-"),
      })

      if (error) {
        console.error("Failed to create organization:", error)
        return
      }

      if (data) {
        setNewOrgName("")
        setNewOrgSlug("")
        setShowCreateForm(false)
        await loadOrganizations()
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
    } finally {
      setIsCreating(false)
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })
      await loadOrganizations()
    } catch (error) {
      console.error("Failed to remove member:", error)
      alert("Failed to remove member. You cannot remove the last owner.")
    }
  }

  // Update member role
  const handleUpdateMemberRole = async (memberId: string, role: "admin" | "member" | "owner") => {
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role,
      })
      await loadOrganizations()
    } catch (error) {
      console.error("Failed to update member role:", error)
      alert("Failed to update member role.")
    }
  }

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId,
      })
      await loadOrganizations()
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
      alert("Failed to cancel invitation.")
    }
  }

  // Invite member
  const handleInviteMember = async (email: string, role: "admin" | "member" | "owner") => {
    try {
      await authClient.organization.inviteMember({
        email,
        role,
      })
      await loadOrganizations()
    } catch (error) {
      console.error("Failed to invite member:", error)
      alert("Failed to invite member. They may already be invited or a member.")
    }
  }

  // Check if user is owner of an organization
  const isOwner = (orgId: string, userId?: string) => {
    const members = membersByOrg[orgId] || []
    const userMember = members.find((m) => m.userId === userId)
    return userMember?.role === "owner"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading organizations...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organizations, members, and invitations
          </p>
        </div>
        {canCreateOrg ? (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "Create Organization"}
          </Button>
        ) : (
          <Link href="/dashboard/settings">
            <Button variant="outline">Become a Creator</Button>
          </Link>
        )}
      </div>

      {!canCreateOrg && (
        <Alert className="mb-8">
          <AlertDescription>
            Organization creation is only available for creators and admins. Upgrade to creator to create organizations.
          </AlertDescription>
        </Alert>
      )}

      {/* Create Organization Form */}
      {showCreateForm && canCreateOrg && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
            <CardDescription>
              Create a new organization to collaborate with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleCreateOrganization(e)} className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="My Company"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="my-company"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  pattern="^[a-z0-9-]+$"
                  title="Lowercase letters, numbers, and hyphens only"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isCreating || !newOrgName.trim()}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Organizations Yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first organization to get started
              </p>
              {canCreateOrg ? (
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Organization
                </Button>
              ) : (
                <Link href="/dashboard/settings">
                  <Button variant="outline">Become a Creator</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {organizations.map((org) => {
            const members = membersByOrg[org.id] || []
            const invitations = invitationsByOrg[org.id] || []
            const currentUserId = members[0]?.userId // Get current user ID from first member

            return (
              <OrganizationCard
                key={org.id}
                organization={org}
                members={members}
                invitations={invitations}
                isOwner={isOwner(org.id, currentUserId)}
                onRemoveMember={handleRemoveMember}
                onUpdateMemberRole={handleUpdateMemberRole}
                onCancelInvitation={handleCancelInvitation}
                onInviteMember={handleInviteMember}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Main Export with AuthGuard
export default function OrganizationsPage() {
  return (
    <AuthGuard>
      <OrganizationsPageContent />
    </AuthGuard>
  )
}
