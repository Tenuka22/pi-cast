/**
 * Profile oRPC Handlers
 *
 * User profile management procedures with real database operations.
 */

import * as schema from "@pi-cast/db/schema"
import { oAuth, oAuthReq, oAuthVerified } from "./index"
import * as v from "valibot"
import { eq, and, desc, count, sql } from "drizzle-orm"

// Admin email for auto-admin assignment
const ADMIN_EMAIL = "tenukaomaljith2009@gmail.com"

/**
 * Get current user's profile
 */
export const profileGetMyProfile = oAuthReq.handler(async ({ context }) => {
  const session = context.userSession
  if (!session) {
    throw new Error("User session not found")
  }

  const db = context.db

  // Get user profile extension
  const [userProfile] = await db
    .select()
    .from(schema.userProfile)
    .where(eq(schema.userProfile.userId, session.user.id))

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
    username: userProfile?.username || null,
    bio: userProfile?.bio || null,
    location: userProfile?.location || null,
    website: userProfile?.website || null,
    role: session.user.role,
    followersCount: userProfile?.followersCount || 0,
    followingCount: userProfile?.followingCount || 0,
    lessonsCount: userProfile?.lessonsCount || 0,
  }
})

/**
 * Update current user's profile
 */
export const profileUpdateMyProfile = oAuthReq
  .input(
    v.object({
      name: v.optional(v.string()),
      username: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  )
  .handler(async ({ input, context }) => {
    const session = context.userSession
    if (!session) {
      throw new Error("User session not found")
    }

    const db = context.db

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

    // Validate username format if provided
    if (input.username) {
      if (input.username.length < 3 || input.username.length > 30) {
        throw new Error("Username must be between 3 and 30 characters")
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
        throw new Error(
          "Username can only contain letters, numbers, underscores, and hyphens"
        )
      }

      // Check if username is already taken
      const [existingUsername] = await db
        .select()
        .from(schema.userProfile)
        .where(
          and(
            eq(schema.userProfile.username, input.username),
            eq(schema.userProfile.userId, session.user.id)
          )
        )

      if (existingUsername && existingUsername.userId !== session.user.id) {
        throw new Error("Username is already taken")
      }
    }

    // Update user basic info (name, image)
    if (input.name || input.image) {
      await db
        .update(schema.user)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.image !== undefined && { image: input.image }),
        })
        .where(eq(schema.user.id, session.user.id))
    }

    // Upsert user profile
    const [existingProfile] = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, session.user.id))

    if (existingProfile) {
      await db
        .update(schema.userProfile)
        .set({
          ...(input.username !== undefined && { username: input.username }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.website !== undefined && { website: input.website }),
        })
        .where(eq(schema.userProfile.userId, session.user.id))
    } else {
      await db.insert(schema.userProfile).values({
        userId: session.user.id,
        username: input.username || null,
        bio: input.bio || null,
        location: input.location || null,
        website: input.website || null,
      })
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        name: input.name,
        username: input.username,
        bio: input.bio,
        location: input.location,
        website: input.website,
        image: input.image,
      },
    }
  })

/**
 * Request creator role for current user
 * Users can upgrade themselves to creator role
 *
 * Role types:
 * - creator: general content creator (non-teacher)
 * - teacher: teacher who creates educational content
 * - admin: platform administrator
 * - student: default role for learners
 */

const Role = {
  creator: "creator",
  teacher: "teacher",
} as const

export const profileRequestCreatorRole = oAuthReq
  .input(
    v.object({
      roleType: v.optional(v.enum(Role)),
    })
  )
  .handler(async ({ input, context }) => {
    const session = context.userSession
    if (!session) {
      throw new Error("User session not found")
    }

    const db = context.db

    // Check if already a creator, teacher, or admin
    if (["creator", "teacher", "admin"].includes(session.user.role || "")) {
      throw new Error("You already have creator, teacher, or admin privileges")
    }

    // Determine role - admin email gets admin, otherwise use requested role or default to creator
    let newRole: string
    if (session.user.email === ADMIN_EMAIL) {
      newRole = "admin"
    } else {
      newRole = input.roleType || "creator"
    }

    // Update user role
    await db
      .update(schema.user)
      .set({ role: newRole })
      .where(eq(schema.user.id, session.user.id))

    // Create user profile if it doesn't exist
    const [existingProfile] = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, session.user.id))

    if (!existingProfile) {
      await db.insert(schema.userProfile).values({
        userId: session.user.id,
      })
    }

    return {
      success: true,
      message: `Successfully upgraded to ${newRole}! You can now create and record lessons.`,
      role: newRole,
    }
  })

/**
 * Get public profile by username
 */
export const profileGetPublicProfile = oAuth
  .input(
    v.object({
      username: v.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const db = context.db
    const authSession = context.userSession

    // Get user profile by username
    const [userProfile] = await db
      .select({
        userId: schema.userProfile.userId,
        username: schema.userProfile.username,
        bio: schema.userProfile.bio,
        location: schema.userProfile.location,
        website: schema.userProfile.website,
        followersCount: schema.userProfile.followersCount,
        followingCount: schema.userProfile.followingCount,
        lessonsCount: schema.userProfile.lessonsCount,
        name: schema.user.name,
        image: schema.user.image,
        createdAt: schema.user.createdAt,
        role: schema.user.role,
      })
      .from(schema.userProfile)
      .innerJoin(schema.user, eq(schema.user.id, schema.userProfile.userId))
      .where(eq(schema.userProfile.username, input.username))

    if (!userProfile) {
      throw new Error("User not found")
    }

    // Get user's published lessons
    const lessons = await db
      .select({
        id: schema.lesson.id,
        title: schema.lesson.title,
        description: schema.lesson.description,
        thumbnailUrl: schema.lesson.thumbnailUrl,
        level: schema.lesson.level,
        viewCount: schema.lesson.viewCount,
        likeCount: schema.lesson.likeCount,
        duration: schema.lesson.duration,
        createdAt: schema.lesson.createdAt,
      })
      .from(schema.lesson)
      .where(
        and(
          eq(schema.lesson.creatorId, userProfile.userId),
          eq(schema.lesson.status, "published")
        )
      )
      .orderBy(desc(schema.lesson.createdAt))
      .limit(12)

    // Check if current user is following
    let isFollowing = false
    let isFollowedByCurrentUser = false
    if (authSession) {
      const [followRecord] = await db
        .select()
        .from(schema.follow)
        .where(
          and(
            eq(schema.follow.followerId, authSession.user.id),
            eq(schema.follow.followingId, userProfile.userId)
          )
        )
      isFollowing = !!followRecord

      // Check if this user follows the current user (for follow back)
      const [followBackRecord] = await db
        .select()
        .from(schema.follow)
        .where(
          and(
            eq(schema.follow.followerId, userProfile.userId),
            eq(schema.follow.followingId, authSession.user.id)
          )
        )
      isFollowedByCurrentUser = !!followBackRecord
    }

    return {
      user: {
        id: userProfile.userId,
        name: userProfile.name,
        username: userProfile.username,
        bio: userProfile.bio,
        location: userProfile.location,
        website: userProfile.website,
        image: userProfile.image,
        role: userProfile.role,
        createdAt: userProfile.createdAt?.getTime() || Date.now(),
        stats: {
          followers: userProfile.followersCount,
          following: userProfile.followingCount,
          lessons: userProfile.lessonsCount,
        },
      },
      lessons: lessons.map((lesson) => ({
        ...lesson,
        createdAt: lesson.createdAt?.getTime() || Date.now(),
      })),
      isFollowing,
      isFollowedByCurrentUser,
    }
  })

/**
 * Get user's lessons with pagination
 */
export const profileGetUserLessons = oAuth
  .input(
    v.object({
      userId: v.string(),
      page: v.optional(v.number()),
      limit: v.optional(v.number()),
    })
  )
  .handler(async ({ input, context }) => {
    const db = context.db
    const page = input.page || 1
    const limit = Math.min(input.limit || 20, 50)
    const offset = (page - 1) * limit

    // Get total count
    const [data] = await db
      .select({ total: count() })
      .from(schema.lesson)
      .where(
        and(
          eq(schema.lesson.creatorId, input.userId),
          eq(schema.lesson.status, "published")
        )
      )

    const total = data?.total ?? 0
    // Get lessons with pagination
    const lessons = await db
      .select({
        id: schema.lesson.id,
        title: schema.lesson.title,
        description: schema.lesson.description,
        thumbnailUrl: schema.lesson.thumbnailUrl,
        level: schema.lesson.level,
        viewCount: schema.lesson.viewCount,
        likeCount: schema.lesson.likeCount,
        duration: schema.lesson.duration,
        createdAt: schema.lesson.createdAt,
      })
      .from(schema.lesson)
      .where(
        and(
          eq(schema.lesson.creatorId, input.userId),
          eq(schema.lesson.status, "published")
        )
      )
      .orderBy(desc(schema.lesson.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      lessons: lessons.map((lesson) => ({
        ...lesson,
        createdAt: lesson.createdAt?.getTime() || Date.now(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  })

/**
 * Follow/unfollow user
 */
export const profileToggleFollow = oAuthReq
  .input(
    v.object({
      userId: v.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const session = context.userSession
    if (!session) {
      throw new Error("User session not found")
    }

    const db = context.db

    // Prevent self-follow
    if (input.userId === session.user.id) {
      throw new Error("Cannot follow yourself")
    }

    // Check if target user exists
    const [targetUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.id, input.userId))

    if (!targetUser) {
      throw new Error("User not found")
    }

    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(schema.follow)
      .where(
        and(
          eq(schema.follow.followerId, session.user.id),
          eq(schema.follow.followingId, input.userId)
        )
      )

    if (existingFollow) {
      // Unfollow
      await db
        .delete(schema.follow)
        .where(
          and(
            eq(schema.follow.followerId, session.user.id),
            eq(schema.follow.followingId, input.userId)
          )
        )

      // Decrement counters
      await db
        .update(schema.userProfile)
        .set({
          followersCount: sql`${schema.userProfile.followersCount} - 1`,
        })
        .where(eq(schema.userProfile.userId, input.userId))

      await db
        .update(schema.userProfile)
        .set({
          followingCount: sql`${schema.userProfile.followingCount} - 1`,
        })
        .where(eq(schema.userProfile.userId, session.user.id))

      return { success: true, following: false }
    } else {
      // Follow
      await db.insert(schema.follow).values({
        followerId: session.user.id,
        followingId: input.userId,
      })

      // Increment counters
      // Ensure profiles exist for both users
      const [followerProfile] = await db
        .select()
        .from(schema.userProfile)
        .where(eq(schema.userProfile.userId, session.user.id))

      if (!followerProfile) {
        await db.insert(schema.userProfile).values({
          userId: session.user.id,
        })
      }

      const [followingProfile] = await db
        .select()
        .from(schema.userProfile)
        .where(eq(schema.userProfile.userId, input.userId))

      if (!followingProfile) {
        await db.insert(schema.userProfile).values({
          userId: input.userId,
        })
      }

      await db
        .update(schema.userProfile)
        .set({
          followersCount: sql`${schema.userProfile.followersCount} + 1`,
        })
        .where(eq(schema.userProfile.userId, input.userId))

      await db
        .update(schema.userProfile)
        .set({
          followingCount: sql`${schema.userProfile.followingCount} + 1`,
        })
        .where(eq(schema.userProfile.userId, session.user.id))

      return { success: true, following: true }
    }
  })

/**
 * Get followers list
 */
export const profileGetFollowers = oAuth
  .input(
    v.object({
      userId: v.string(),
      page: v.optional(v.number()),
      limit: v.optional(v.number()),
    })
  )
  .handler(async ({ input, context }) => {
    const db = context.db
    const authSession = context.userSession
    const page = input.page || 1
    const limit = Math.min(input.limit || 20, 50)
    const offset = (page - 1) * limit

    // Get total count
    const [data] = await db
      .select({ total: count() })
      .from(schema.follow)
      .where(eq(schema.follow.followingId, input.userId))

    const total = data?.total ?? 0
    // Get followers
    const followers = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
        username: schema.userProfile.username,
        bio: schema.userProfile.bio,
        followersCount: schema.userProfile.followersCount,
      })
      .from(schema.follow)
      .innerJoin(schema.user, eq(schema.user.id, schema.follow.followerId))
      .leftJoin(
        schema.userProfile,
        eq(schema.userProfile.userId, schema.follow.followerId)
      )
      .where(eq(schema.follow.followingId, input.userId))
      .limit(limit)
      .offset(offset)

    // Check if current user follows each follower
    const followersWithFollowing = await Promise.all(
      followers.map(async (follower) => {
        let isFollowing = false
        if (authSession) {
          const [followRecord] = await db
            .select()
            .from(schema.follow)
            .where(
              and(
                eq(schema.follow.followerId, authSession.user.id),
                eq(schema.follow.followingId, follower.id)
              )
            )
          isFollowing = !!followRecord
        }
        return {
          ...follower,
          isFollowing,
        }
      })
    )

    return {
      followers: followersWithFollowing,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  })

/**
 * Get following list
 */
export const profileGetFollowing = oAuth
  .input(
    v.object({
      userId: v.string(),
      page: v.optional(v.number()),
      limit: v.optional(v.number()),
    })
  )
  .handler(async ({ input, context }) => {
    const db = context.db
    const authSession = context.userSession
    const page = input.page || 1
    const limit = Math.min(input.limit || 20, 50)
    const offset = (page - 1) * limit

    // Get total count
    const [data] = await db
      .select({ total: count() })
      .from(schema.follow)
      .where(eq(schema.follow.followerId, input.userId))

    const total = data?.total ?? 0

    // Get following
    const following = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
        username: schema.userProfile.username,
        bio: schema.userProfile.bio,
        followersCount: schema.userProfile.followersCount,
      })
      .from(schema.follow)
      .innerJoin(schema.user, eq(schema.user.id, schema.follow.followingId))
      .leftJoin(
        schema.userProfile,
        eq(schema.userProfile.userId, schema.follow.followingId)
      )
      .where(eq(schema.follow.followerId, input.userId))
      .limit(limit)
      .offset(offset)

    // Check if current user follows each following
    const followingWithFollowing = await Promise.all(
      following.map(async (user) => {
        let isFollowing = false
        if (authSession) {
          const [followRecord] = await db
            .select()
            .from(schema.follow)
            .where(
              and(
                eq(schema.follow.followerId, authSession.user.id),
                eq(schema.follow.followingId, user.id)
              )
            )
          isFollowing = !!followRecord
        }
        return {
          ...user,
          isFollowing,
        }
      })
    )

    return {
      following: followingWithFollowing,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  })
