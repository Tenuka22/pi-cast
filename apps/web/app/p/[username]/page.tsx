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
import { orpc } from "@/lib/server-orpc-client"

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
    const result = await orpc.profileGetPublicProfile({ username })
    return result
  } catch (error) {
    console.error("Error fetching public profile:", error)
    throw error
  }
})

/**
 * Fetch public profile data from oRPC handler by user ID
 */
const fetchPublicProfileByUserId = cache(async (userId: string) => {
  try {
    const result = await orpc.profileGetUserLessons({ userId })

    // Get user info from my profile endpoint to get basic details
    // This is a workaround - in production you'd have a getUserById endpoint
    return {
      user: {
        id: userId,
        // We'll need to fetch user details separately
      },
      lessons: result?.lessons || [],
      isFollowing: false,
      isFollowedByCurrentUser: false,
    }
  } catch (error) {
    console.error("Error fetching public profile by ID:", error)
    return null
  }
})

/**
 * Check if current user is authenticated and get their info
 */
const getCurrentUser = cache(async () => {
  try {
    const result = await orpc.profileGetMyProfile()
    return result
  } catch (error) {
    return null
  }
})

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params

  // Check if this is a user ID lookup (starts with "id:")
  const isIdLookup = username.startsWith("id:")
  const identifier = isIdLookup ? username.slice(3) : username

  // Fetch profile data
  let profileData
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
  const isOwner = currentUser && currentUser.id === profileData.user.id

  // Check if current user can edit (creator, teacher, or admin)
  const canEdit = Boolean(
    isOwner &&
    currentUser &&
    ["creator", "teacher", "admin"].includes(currentUser.role || "")
  )

  // Check if user needs to set username
  const needsUsername = !profileData.user.username

  return (
    <ProfileClient
      profileData={profileData}
      currentUser={currentUser}
      isOwner={!!isOwner}
      canEdit={canEdit}
      needsUsername={needsUsername}
    />
  )
}
