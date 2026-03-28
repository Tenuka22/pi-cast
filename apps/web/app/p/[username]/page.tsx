/**
 * Public Profile Page
 *
 * Display creator's public profile with their lessons and stats.
 * Supports editing for profile owners (creators/admins).
 *
 * URL patterns:
 * - /p/[username] - Access by username (e.g., /p/jane-smith)
 * - /p/id/[userId] - Access by user ID (e.g., /p/id/usr123abc)
 */

import { notFound } from "next/navigation"
import { ProfileClient } from "./profile-client"
import { cache } from "react"
import {
  getApiProfileUsername,
  getApiProfileUserUserIdLessons,
  getApiProfileMe,
} from "@/lib/api/profile/profile"
import type { PublicProfile } from "@/lib/api/schemas"

function isValidLessonLevel(level: unknown): level is "beginner" | "intermediate" | "advanced" | null {
  return level === null || level === "beginner" || level === "intermediate" || level === "advanced"
}

function normalizeLessonLevel(level: unknown): "beginner" | "intermediate" | "advanced" | null {
  if (isValidLessonLevel(level)) {
    return level
  }
  return null
}

interface PageProps {
  params: Promise<{
    username: string
  }>
}

/**
 * Fetch public profile data from oRPC handler by username
 */
const fetchPublicProfileByUsername = cache(async (username: string) => {
  try {
    const result = await getApiProfileUsername(username)
    return result
  } catch (error) {
    console.error("Error fetching public profile:", error)
    throw error
  }
})

/**
 * Fetch public profile data from oRPC handler by user ID
 */
const fetchPublicProfileByUserId = cache(async (userId: string): Promise<PublicProfile | null> => {
  try {
    const result = await getApiProfileUserUserIdLessons(userId)

    // Get user info from my profile endpoint to get basic details
    // This is a workaround - in production you'd have a getUserById endpoint
    return {
      user: {
        userId,
        id: userId,
        name: "",
        username: null,
        bio: null,
        location: null,
        website: null,
        image: null,
        role: null,
        createdAt: Date.now(),
        followersCount: 0,
        followingCount: 0,
        lessonsCount: result?.lessons?.length || 0,
        stats: {
          followers: 0,
          following: 0,
          lessons: result?.lessons?.length || 0,
        },
      },
      lessons: (result?.lessons || []).map((lesson) => ({
        ...lesson,
        level: normalizeLessonLevel(lesson.level),
      })),
      isFollowing: false,
      isFollowedByCurrentUser: false,
    }
  } catch {
    return null
  }
})

/**
 * Check if current user is authenticated and get their info
 */
const getCurrentUser = cache(async () => {
  try {
    const result = await getApiProfileMe()
    return result
  } catch {
    return null
  }
})

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params

  // Check if this is a user ID lookup (starts with "id:")
  const isIdLookup = username.startsWith("id:")
  const identifier = isIdLookup ? username.slice(3) : username

  // Fetch profile data
  let profileData: PublicProfile | null
  if (isIdLookup) {
    profileData = await fetchPublicProfileByUserId(identifier)
  } else {
    profileData = await fetchPublicProfileByUsername(identifier)
  }

  if (!profileData) {
    notFound()
  }

  // Get current user (for edit permissions and follow status)
  const currentUser = await getCurrentUser()

  // Check if current user is viewing their own profile
  const isOwner = currentUser && typeof currentUser === "object" && "user" in currentUser && currentUser.user && typeof currentUser.user === "object" && "id" in currentUser.user
    ? currentUser.user.id === profileData.user.id 
    : false

  // Check if current user can edit (creator, teacher, or admin)
  const canEdit = Boolean(
    isOwner &&
    currentUser &&
    typeof currentUser === "object" && "user" in currentUser && currentUser.user && typeof currentUser.user === "object" && "role" in currentUser.user && typeof currentUser.user.role === "string"
    ? ["creator", "teacher", "admin"].includes(currentUser.user.role)
    : false
  )

  // Check if user needs to set username
  const needsUsername = !profileData.user.username

  // Transform profile data to match ProfileData type (stricter lesson level typing)
  const transformedProfileData = {
    ...profileData,
    lessons: profileData.lessons.map((lesson) => ({
      ...lesson,
      level: normalizeLessonLevel(lesson.level),
    })),
  }

  return (
    <ProfileClient
      profileData={transformedProfileData}
      currentUser={currentUser}
      isOwner={!!isOwner}
      canEdit={canEdit}
      needsUsername={needsUsername}
    />
  )
}
