/**
 * Profile oRPC Handlers
 *
 * User profile management procedures.
 */

import { auth } from "@pi-cast/db"
import { base } from "../index"
import * as v from "valibot"
import { createGetAuthSession } from "../auth-middleware"

// Create auth session helper
const getAuthSession = createGetAuthSession(auth)

// Note: Database operations are stubs - implement with proper db connection

/**
 * Get current user's profile
 */
export const profileGetMyProfile = base.handler(async ({ context }) => {
  const session = await getAuthSession(context.headers)

  // TODO: Implement database query
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
    bio: null,
    location: null,
    website: null,
    role: session.user.role,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
})

/**
 * Update current user's profile
 */
export const profileUpdateMyProfile = base
  .input(
    v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  )
  .handler(async ({ input, context }) => {
    const session = await getAuthSession(context.headers)

    // Validate website URL if provided
    if (input.website) {
      try {
        const url = input.website.startsWith("http")
          ? input.website
          : `https://${input.website}`
        new URL(url)
      } catch {
        throw new Error("Invalid website URL")
      }
    }

    // Validate bio length
    if (input.bio && input.bio.length > 500) {
      throw new Error("Bio must be less than 500 characters")
    }

    // TODO: Implement database update
    console.log("Update profile for user:", session.user.id, input)

    return { success: true, message: "Profile updated" }
  })

/**
 * Request creator role for current user
 * Users can upgrade themselves to creator role
 */
export const profileRequestCreatorRole = base.handler(async ({ context }) => {
  const session = await getAuthSession(context.headers)

  // Check if already a creator or admin
  if (session.user.role === "creator" || session.user.role === "admin") {
    throw new Error("You already have creator or admin privileges")
  }

  const newRole = session.user.email === adminEmail ? "admin" : "creator"

  // TODO: Implement database update
  // For now, this is a stub - in production, update the user's role in the database
  console.log(
    `Upgrading user ${session.user.id} (${session.user.email}) to ${newRole}`
  )

  return {
    success: true,
    message: `Successfully upgraded to ${newRole}! You can now create and record lessons.`,
    role: newRole,
  }
})

/**
 * Get public profile by username/ID
 */
export const profileGetPublicProfile = base
  .input(
    v.object({
      username: v.string(),
    })
  )
  .handler(async ({ input }) => {
    // TODO: Implement database query
    return {
      user: {
        id: "user-1",
        name: input.username,
        bio: "Sample bio",
        location: null,
        website: null,
        image: null,
        role: "teacher",
        createdAt: Date.now(),
      },
      stats: {
        lessons: 0,
        students: 0,
        rating: 0,
      },
      lessons: [],
    }
  })

/**
 * Get user's lessons
 */
export const profileGetUserLessons = base
  .input(
    v.object({
      userId: v.string(),
      page: v.optional(v.number()),
      limit: v.optional(v.number()),
    })
  )
  .handler(async () => {
    // TODO: Implement lesson query
    return {
      lessons: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }
  })

/**
 * Follow/unfollow user
 */
export const profileToggleFollow = base
  .input(
    v.object({
      userId: v.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const session = await getAuthSession(context.headers)

    // Prevent self-follow
    if (input.userId === session.user.id) {
      throw new Error("Cannot follow yourself")
    }

    // TODO: Implement follow/unfollow logic
    return { success: true, following: true }
  })
