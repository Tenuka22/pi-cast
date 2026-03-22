/**
 * Profile Client Component
 *
 * Client-side interactive profile page with edit functionality.
 */

"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { toast } from "sonner"
import { toggleFollow, updateProfile } from "@/app/actions/profile-actions"

interface Lesson {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  level: "beginner" | "intermediate" | "advanced" | null
  viewCount: number
  likeCount: number
  duration: number | null
  createdAt: number
}

interface ProfileUser {
  id: string
  name: string
  username: string | null
  bio: string | null
  location: string | null
  website: string | null
  image: string | null
  role: string | null
  createdAt: number
  stats: {
    followers: number
    following: number
    lessons: number
  }
}

interface ProfileData {
  user: ProfileUser
  lessons: Lesson[]
  isFollowing: boolean
  isFollowedByCurrentUser: boolean
}

interface CurrentUser {
  id: string
  name: string
  email: string
  username: string | null
  bio: string | null
  location: string | null
  website: string | null
  image: string | null | undefined
  role: string | null | undefined
}

interface ProfileClientProps {
  profileData: ProfileData
  currentUser: CurrentUser | null
  isOwner: boolean
  canEdit: boolean
  needsUsername?: boolean
}

export function ProfileClient({
  profileData,
  currentUser,
  isOwner,
  canEdit,
  needsUsername = false,
}: ProfileClientProps) {
  const [user, setUser] = useState<ProfileUser>(profileData.user)
  const [lessons] = useState<Lesson[]>(profileData.lessons)
  const [isFollowing, setIsFollowing] = useState(profileData.isFollowing)
  const [isFollowedByCurrentUser, setIsFollowedByCurrentUser] = useState(
    profileData.isFollowedByCurrentUser
  )
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    bio: currentUser?.bio || "",
    location: currentUser?.location || "",
    website: currentUser?.website || "",
    image: currentUser?.image || "",
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getRoleBadge = (role: string | null) => {
    if (!role) return null

    switch (role) {
      case "admin":
        return (
          <Badge className="mt-2" variant="default">
            👑 Admin
          </Badge>
        )
      case "teacher":
        return (
          <Badge className="mt-2" variant="secondary">
            🎓 Teacher
          </Badge>
        )
      case "creator":
        return (
          <Badge className="mt-2" variant="outline">
            🎬 Creator
          </Badge>
        )
      default:
        return (
          <Badge className="mt-2" variant="secondary">
            📚 Student
          </Badge>
        )
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Please sign in to follow users")
      return
    }

    setIsFollowingLoading(true)
    try {
      const result = await toggleFollow(user.id)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to toggle follow")
      }

      const newFollowingState = result.data.following

      setIsFollowing(newFollowingState)

      // Update stats
      setUser((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers: prev.stats.followers + (newFollowingState ? 1 : -1),
        },
      }))

      toast.success(newFollowingState ? "Following user" : "Unfollowed user")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to toggle follow")
      console.error(error)
    } finally {
      setIsFollowingLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    // Validate username if required
    if (needsUsername && !editForm.username) {
      toast.error("Username is required")
      return
    }

    // Validate username format
    if (editForm.username) {
      if (editForm.username.length < 3 || editForm.username.length > 30) {
        toast.error("Username must be between 3 and 30 characters")
        return
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(editForm.username)) {
        toast.error(
          "Username can only contain letters, numbers, underscores, and hyphens"
        )
        return
      }
    }

    try {
      const result = await updateProfile(editForm)

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile")
      }

      if (result.data?.success) {
        toast.success("Profile updated successfully")
        setIsEditOpen(false)
        // Reload page to show updated data
        window.location.reload()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      )
      console.error(error)
    }
  }

  const validateWebsite = (url: string) => {
    if (!url) return true
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`
      new URL(fullUrl)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Username Prompt Banner - Show for owners without username */}
      {needsUsername && isOwner && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-800">⚠️</span>
              <p className="font-medium text-yellow-800">
                You haven't set a username yet
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = `/p/id:${user.id}`)}
              >
                View Profile
              </Button>
              <Button
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Set Username
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-4xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold">{user.name}</h1>
              {user.username && (
                <p className="mt-1 text-muted-foreground">@{user.username}</p>
              )}
              {getRoleBadge(user.role)}
              {user.location && (
                <p className="mt-2 text-muted-foreground">📍 {user.location}</p>
              )}
              {user.website && (
                <a
                  href={
                    user.website.startsWith("http")
                      ? user.website
                      : `https://${user.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-primary hover:underline"
                >
                  🔗 {user.website}
                </a>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Edit button for owners who are creators/admins */}
              {canEdit && (
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger
                    render={<Button variant="outline">Edit Profile</Button>}
                  ></DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information. Click save when you're
                        done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-username">
                          Username{" "}
                          {needsUsername && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="edit-username"
                          value={editForm.username}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              username: e.target.value,
                            })
                          }
                          placeholder="username"
                          required={needsUsername}
                        />
                        <p className="text-xs text-muted-foreground">
                          3-30 characters, letters, numbers, underscores, and
                          hyphens only
                        </p>
                        {needsUsername && (
                          <p className="text-xs font-medium text-red-500">
                            ⚠️ Username is required to create your profile
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-bio">Bio</Label>
                        <Textarea
                          id="edit-bio"
                          value={editForm.bio}
                          onChange={(e) =>
                            setEditForm({ ...editForm, bio: e.target.value })
                          }
                          placeholder="Tell us about yourself..."
                          className="resize-none"
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          {editForm.bio?.length || 0}/500 characters
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-location">Location</Label>
                        <Input
                          id="edit-location"
                          value={editForm.location}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              location: e.target.value,
                            })
                          }
                          placeholder="San Francisco, CA"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-website">Website</Label>
                        <Input
                          id="edit-website"
                          value={editForm.website}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              website: e.target.value,
                            })
                          }
                          placeholder="yourwebsite.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-image">Profile Image URL</Label>
                        <Input
                          id="edit-image"
                          value={editForm.image}
                          onChange={(e) =>
                            setEditForm({ ...editForm, image: e.target.value })
                          }
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Follow button (not for owners) */}
              {!isOwner && currentUser && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={isFollowingLoading}
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isFollowingLoading
                    ? "Loading..."
                    : isFollowing
                      ? "Following"
                      : "Follow"}
                </Button>
              )}

              {/* Message button (placeholder) */}
              {!isOwner && currentUser && (
                <Button variant="outline" disabled>
                  Message
                </Button>
              )}

              {/* Sign in prompt for non-authenticated users */}
              {!currentUser && !isOwner && (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/sign-in")}
                >
                  Sign in to follow
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto -mt-8 px-4">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Lessons" value={user.stats.lessons.toString()} />
          <StatCard
            label="Followers"
            value={formatNumber(user.stats.followers)}
          />
          <StatCard
            label="Following"
            value={formatNumber(user.stats.following)}
          />
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {user.bio}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lessons */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="lessons" className="w-full">
          <TabsList>
            <TabsTrigger value="lessons">
              Lessons ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="about" disabled>
              About (Coming Soon)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="lessons" className="mt-6">
            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isOwner
                    ? "You haven't created any lessons yet. Start creating!"
                    : "This user hasn't created any lessons yet."}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-6 text-center">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          {lesson.level && (
            <Badge variant="outline" className="capitalize">
              {lesson.level}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            👍 {formatNumber(lesson.likeCount)}
          </span>
        </div>
        <CardTitle className="text-lg">{lesson.title}</CardTitle>
        {lesson.description && (
          <CardDescription className="line-clamp-2">
            {lesson.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>👁️ {formatNumber(lesson.viewCount)} views</span>
          {lesson.duration && <span>⏱️ {formatDuration(lesson.duration)}</span>}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Lesson</Button>
      </CardFooter>
    </Card>
  )
}
