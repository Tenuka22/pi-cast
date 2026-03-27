import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi"
import { eq, and, desc, count, sql } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import * as schema from "@/db/schema"
import type { Context } from "@/index"

// Admin email for auto-admin assignment
const ADMIN_EMAIL = "tenukaomaljith2009@gmail.com"

// Generate Zod schemas from Drizzle schema with OpenAPI support
const UserProfileSchema = createSelectSchema(schema.userProfile)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    userId: z.string().openapi({ example: "user-123", description: "User ID" }),
    username: z.string().nullable().openapi({ example: "johndoe", description: "Username" }),
    bio: z.string().nullable().openapi({ example: "Software developer", description: "User bio" }),
    location: z.string().nullable().openapi({ example: "New York", description: "Location" }),
    website: z.string().nullable().openapi({ example: "https://example.com", description: "Website URL" }),
    followersCount: z.number().openapi({ example: 100, description: "Number of followers" }),
    followingCount: z.number().openapi({ example: 50, description: "Number of following" }),
    lessonsCount: z.number().openapi({ example: 10, description: "Number of lessons" }),
  })
  .merge(
    z.object({
      id: z.string().openapi({ example: "user-123" }),
      name: z.string().openapi({ example: "John Doe" }),
      email: z.string().email().openapi({ example: "john@example.com" }),
      emailVerified: z.boolean().openapi({ example: true }),
      image: z.string().nullable().openapi({ example: "https://example.com/image.jpg" }),
      role: z.string().nullable().openapi({ example: "creator" }),
    })
  )
  .openapi("UserProfile")

const UserStatsSchema = z
  .object({
    followers: z.number().openapi({ example: 100 }),
    following: z.number().openapi({ example: 50 }),
    lessons: z.number().openapi({ example: 10 }),
  })
  .openapi("UserStats")

const UserPublicSchema = createSelectSchema(schema.userProfile)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    username: z.string().nullable().openapi({ example: "johndoe" }),
    bio: z.string().nullable().openapi({ example: "Software developer" }),
    location: z.string().nullable().openapi({ example: "New York" }),
    website: z.string().nullable().openapi({ example: "https://example.com" }),
    followersCount: z.number().openapi({ example: 100 }),
    followingCount: z.number().openapi({ example: 50 }),
    lessonsCount: z.number().openapi({ example: 10 }),
  })
  .merge(
    z.object({
      id: z.string().openapi({ example: "user-123" }),
      name: z.string().openapi({ example: "John Doe" }),
      image: z.string().nullable().openapi({ example: "https://example.com/image.jpg" }),
      role: z.string().nullable().openapi({ example: "creator" }),
      createdAt: z.number().openapi({ example: 1234567890 }),
      stats: UserStatsSchema,
    })
  )
  .openapi("UserPublic")

const LessonSchema = createSelectSchema(schema.lesson)
  .pick({
    id: true,
    title: true,
    description: true,
    thumbnailUrl: true,
    level: true,
    viewCount: true,
    likeCount: true,
    duration: true,
    createdAt: true,
  })
  .extend({
    title: z.string().openapi({ example: "Introduction to TypeScript" }),
    description: z.string().nullable().openapi({ example: "Learn the basics" }),
    thumbnailUrl: z.string().nullable().openapi({ example: "https://example.com/thumb.jpg" }),
    level: z.string().nullable().openapi({ example: "beginner" }),
    viewCount: z.number().openapi({ example: 1000 }),
    likeCount: z.number().openapi({ example: 50 }),
    duration: z.number().nullable().openapi({ example: 300 }),
    createdAt: z.number().openapi({ example: 1234567890 }),
  })
  .openapi("Lesson")

const LessonItemSchema = LessonSchema.openapi("LessonItem")

const PublicProfileSchema = z
  .object({
    user: UserPublicSchema,
    lessons: z.array(LessonItemSchema),
    isFollowing: z.boolean().openapi({ example: false }),
    isFollowedByCurrentUser: z.boolean().openapi({ example: false }),
  })
  .openapi("PublicProfile")

const FollowerSchema = createSelectSchema(schema.userProfile)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    username: z.string().nullable().openapi({ example: "johndoe" }),
    bio: z.string().nullable().openapi({ example: "Software developer" }),
    followersCount: z.number().nullable().openapi({ example: 100 }),
  })
  .merge(
    z.object({
      id: z.string().openapi({ example: "user-123" }),
      name: z.string().openapi({ example: "John Doe" }),
      image: z.string().nullable().openapi({ example: "https://example.com/image.jpg" }),
      isFollowing: z.boolean().openapi({ example: false }),
    })
  )
  .openapi("Follower")

const PaginationSchema = z
  .object({
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
    total: z.number().openapi({ example: 100 }),
    totalPages: z.number().openapi({ example: 5 }),
  })
  .openapi("Pagination")

/**
 * Profile Routes
 */
export function createProfileRoutes() {
  const app = new OpenAPIHono<Context>()

  /**
   * GET /api/profile/me
   * Get current user's profile
   */
  const getMyProfileRoute = createRoute({
    method: "get",
    path: "/api/profile/me",
    summary: "Get current user profile",
    description: "Get the authenticated user's profile information",
    tags: ["Profile"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "User profile retrieved successfully",
        content: {
          "application/json": {
            schema: UserProfileSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  })

  app.openapi(getMyProfileRoute, async (c) => {
    const session = c.get("session")
    const user = c.get("user")
    if (!session || !user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        401
      )
    }

    const db = c.get("db")
    const [userProfile] = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, user.id))

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      username: userProfile?.username || null,
      bio: userProfile?.bio || null,
      location: userProfile?.location || null,
      website: userProfile?.website || null,
      role: user.role,
      followersCount: userProfile?.followersCount || 0,
      followingCount: userProfile?.followingCount || 0,
      lessonsCount: userProfile?.lessonsCount || 0,
    }

    return c.json(response)
  })

  /**
   * PUT /api/profile/me
   * Update current user's profile
   */
  const updateProfileSchema = z
    .object({
      name: z.string().optional(),
      username: z.string().min(3).max(30).optional(),
      bio: z.string().max(500).optional(),
      location: z.string().optional(),
      website: z.string().optional(),
      image: z.string().url().optional(),
    })
    .openapi("UpdateProfile")

  const updateMyProfileRoute = createRoute({
    method: "put",
    path: "/api/profile/me",
    summary: "Update current user profile",
    description: "Update the authenticated user's profile information",
    tags: ["Profile"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateProfileSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Profile updated successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.boolean(),
                message: z.string(),
                data: updateProfileSchema,
              })
              .openapi("UpdateProfileResponse"),
          },
        },
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.boolean(),
                error: z.object({
                  code: z.string(),
                  message: z.string(),
                  status: z.number(),
                }),
              })
              .openapi("UpdateProfileError"),
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  })

  app.openapi(updateMyProfileRoute, async (c) => {
    const session = c.get("session")
    const user = c.get("user")
    if (!session || !user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        401
      )
    }

    const body = await c.req.json() as unknown
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            status: 400,
            details: parsed.error.flatten(),
          },
        },
        400
      )
    }

    const input = parsed.data
    const db = c.get("db")

    // Validate website URL if provided
    if (input.website) {
      try {
        const url = input.website.startsWith("http")
          ? input.website
          : `https://${input.website}`
        new URL(url)
      } catch {
        return c.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid website URL",
              status: 400,
            },
          },
          400
        )
      }
    }

    // Validate username format if provided
    if (input.username) {
      if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
        return c.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message:
                "Username can only contain letters, numbers, underscores, and hyphens",
              status: 400,
            },
          },
          400
        )
      }

      // Check if username is already taken
      const [existingUsername] = await db
        .select()
        .from(schema.userProfile)
        .where(
          and(
            eq(schema.userProfile.username, input.username),
            eq(schema.userProfile.userId, user.id)
          )
        )

      if (existingUsername && existingUsername.userId !== user.id) {
        return c.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Username is already taken",
              status: 409,
            },
          },
          409
        )
      }
    }

    // Update user basic info (name, image)
    if (input.name || input.image) {
      await db
        .update(schema.users)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.image !== undefined && { image: input.image }),
        })
        .where(eq(schema.users.id, user.id))
    }

    // Upsert user profile
    const [existingProfile] = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, user.id))

    if (existingProfile) {
      await db
        .update(schema.userProfile)
        .set({
          ...(input.username !== undefined && { username: input.username }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.website !== undefined && { website: input.website }),
        })
        .where(eq(schema.userProfile.userId, user.id))
    } else {
      await db.insert(schema.userProfile).values({
        userId: user.id,
        username: input.username || null,
        bio: input.bio || null,
        location: input.location || null,
        website: input.website || null,
      })
    }

    return c.json({
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
    })
  })

  /**
   * POST /api/profile/creator-role
   * Request creator role
   */
  const requestCreatorRoleSchema = z
    .object({
      roleType: z.enum(["creator", "teacher"]).optional(),
    })
    .openapi("RequestCreatorRole")

  const requestCreatorRoleRoute = createRoute({
    method: "post",
    path: "/api/profile/creator-role",
    summary: "Request creator role",
    description: "Request to upgrade to creator or teacher role",
    tags: ["Profile"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: requestCreatorRoleSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Role upgraded successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.boolean(),
                message: z.string(),
                role: z.string(),
              })
              .openapi("RequestCreatorRoleResponse"),
          },
        },
      },
      400: {
        description: "Already has creator privileges",
      },
      401: {
        description: "Unauthorized",
      },
    },
  })

  app.openapi(requestCreatorRoleRoute, async (c) => {
    const session = c.get("session")
    const user = c.get("user")
    if (!session || !user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        401
      )
    }

    const body = await c.req.json() as unknown
    const parsed = requestCreatorRoleSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            status: 400,
          },
        },
        400
      )
    }

    const db = c.get("db")

    // Check if already a creator, teacher, or admin
    if (["creator", "teacher", "admin"].includes(user.role || "")) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "You already have creator, teacher, or admin privileges",
            status: 409,
          },
        },
        409
      )
    }

    // Determine role
    let newRole: string
    if (user.email === ADMIN_EMAIL) {
      newRole = "admin"
    } else {
      newRole = parsed.data.roleType || "creator"
    }

    // Update user role
    await db
      .update(schema.users)
      .set({ role: newRole })
      .where(eq(schema.users.id, user.id))

    // Create user profile if it doesn't exist
    const [existingProfile] = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, user.id))

    if (!existingProfile) {
      await db.insert(schema.userProfile).values({
        userId: user.id,
      })
    }

    return c.json({
      success: true,
      message: `Successfully upgraded to ${newRole}! You can now create and record lessons.`,
      role: newRole,
    })
  })

  /**
   * GET /api/profile/:username
   * Get public profile by username
   */
  const getPublicProfileRoute = createRoute({
    method: "get",
    path: "/api/profile/{username}",
    summary: "Get public profile",
    description: "Get a user's public profile by username",
    tags: ["Profile"],
    request: {
      params: z.object({
        username: z.string(),
      }),
    },
    responses: {
      200: {
        description: "Public profile retrieved successfully",
        content: {
          "application/json": {
            schema: PublicProfileSchema,
          },
        },
      },
      404: {
        description: "User not found",
      },
    },
  })

  app.openapi(getPublicProfileRoute, async (c) => {
    const { username } = c.req.param()
    const db = c.get("db")
    const authSession = c.get("session")
    const user = c.get("user")

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
        name: schema.users.name,
        image: schema.users.image,
        createdAt: schema.users.createdAt,
        role: schema.users.role,
      })
      .from(schema.userProfile)
      .innerJoin(schema.users, eq(schema.users.id, schema.userProfile.userId))
      .where(eq(schema.userProfile.username, username))

    if (!userProfile) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
            status: 404,
          },
        },
        404
      )
    }

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

    let isFollowing = false
    let isFollowedByCurrentUser = false
    if (authSession && user) {
      const [followRecord] = await db
        .select()
        .from(schema.follow)
        .where(
          and(
            eq(schema.follow.followerId, user.id),
            eq(schema.follow.followingId, userProfile.userId)
          )
        )
      isFollowing = !!followRecord

      const [followBackRecord] = await db
        .select()
        .from(schema.follow)
        .where(
          and(
            eq(schema.follow.followerId, userProfile.userId),
            eq(schema.follow.followingId, user.id)
          )
        )
      isFollowedByCurrentUser = !!followBackRecord
    }

    return c.json({
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
    })
  })

  /**
   * GET /api/profile/user/:userId/lessons
   * Get user's lessons with pagination
   */
  const getUserLessonsRoute = createRoute({
    method: "get",
    path: "/api/profile/user/{userId}/lessons",
    summary: "Get user lessons",
    description: "Get a user's published lessons with pagination",
    tags: ["Profile"],
    request: {
      params: z.object({
        userId: z.string(),
      }),
      query: z.object({
        page: z.coerce.number().optional().default(1),
        limit: z.coerce.number().optional().default(20),
      }),
    },
    responses: {
      200: {
        description: "Lessons retrieved successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                lessons: z.array(LessonSchema),
                pagination: PaginationSchema,
              })
              .openapi("GetUserLessonsResponse"),
          },
        },
      },
    },
  })

  app.openapi(getUserLessonsRoute, async (c) => {
    const { userId } = c.req.param()
    const query = c.req.valid("query")
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 50)
    const offset = (page - 1) * limit

    const db = c.get("db")

    const [data] = await db
      .select({ total: count() })
      .from(schema.lesson)
      .where(
        and(
          eq(schema.lesson.creatorId, userId),
          eq(schema.lesson.status, "published")
        )
      )

    const total = data?.total ?? 0

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
          eq(schema.lesson.creatorId, userId),
          eq(schema.lesson.status, "published")
        )
      )
      .orderBy(desc(schema.lesson.createdAt))
      .limit(limit)
      .offset(offset)

    return c.json({
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
    })
  })

  /**
   * POST /api/profile/follow
   * Follow/unfollow user
   */
  const toggleFollowSchema = z
    .object({
      userId: z.string(),
    })
    .openapi("ToggleFollow")

  const toggleFollowRoute = createRoute({
    method: "post",
    path: "/api/profile/follow",
    summary: "Toggle follow",
    description: "Follow or unfollow a user",
    tags: ["Profile"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: toggleFollowSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Follow status toggled",
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.boolean(),
                following: z.boolean(),
              })
              .openapi("ToggleFollowResponse"),
          },
        },
      },
      400: {
        description: "Cannot follow yourself",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "User not found",
      },
    },
  })

  app.openapi(toggleFollowRoute, async (c) => {
    const session = c.get("session")
    const user = c.get("user")
    if (!session || !user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        401
      )
    }

    const body = await c.req.json()
    const parsed = toggleFollowSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            status: 400,
          },
        },
        400
      )
    }

    const db = c.get("db")
    const { userId } = parsed.data

    // Prevent self-follow
    if (userId === user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Cannot follow yourself",
            status: 400,
          },
        },
        400
      )
    }

    // Check if target user exists
    const [targetUser] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, userId))

    if (!targetUser) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
            status: 404,
          },
        },
        404
      )
    }

    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(schema.follow)
      .where(
        and(
          eq(schema.follow.followerId, user.id),
          eq(schema.follow.followingId, userId)
        )
      )

    if (existingFollow) {
      // Unfollow
      await db
        .delete(schema.follow)
        .where(
          and(
            eq(schema.follow.followerId, user.id),
            eq(schema.follow.followingId, userId)
          )
        )

      await db
        .update(schema.userProfile)
        .set({
          followersCount: sql`${schema.userProfile.followersCount} - 1`,
        })
        .where(eq(schema.userProfile.userId, userId))

      await db
        .update(schema.userProfile)
        .set({
          followingCount: sql`${schema.userProfile.followingCount} - 1`,
        })
        .where(eq(schema.userProfile.userId, user.id))

      return c.json({ success: true, following: false })
    } else {
      // Follow
      await db.insert(schema.follow).values({
        followerId: user.id,
        followingId: userId,
      })

      // Ensure profiles exist
      const [followerProfile] = await db
        .select()
        .from(schema.userProfile)
        .where(eq(schema.userProfile.userId, user.id))

      if (!followerProfile) {
        await db.insert(schema.userProfile).values({
          userId: user.id,
        })
      }

      const [followingProfile] = await db
        .select()
        .from(schema.userProfile)
        .where(eq(schema.userProfile.userId, userId))

      if (!followingProfile) {
        await db.insert(schema.userProfile).values({
          userId,
        })
      }

      await db
        .update(schema.userProfile)
        .set({
          followersCount: sql`${schema.userProfile.followersCount} + 1`,
        })
        .where(eq(schema.userProfile.userId, userId))

      await db
        .update(schema.userProfile)
        .set({
          followingCount: sql`${schema.userProfile.followingCount} + 1`,
        })
        .where(eq(schema.userProfile.userId, user.id))

      return c.json({ success: true, following: true })
    }
  })

  /**
   * GET /api/profile/user/:userId/followers
   * Get followers list
   */
  const getFollowersRoute = createRoute({
    method: "get",
    path: "/api/profile/user/{userId}/followers",
    summary: "Get followers",
    description: "Get a user's followers with pagination",
    tags: ["Profile"],
    request: {
      params: z.object({
        userId: z.string(),
      }),
      query: z.object({
        page: z.coerce.number().optional().default(1),
        limit: z.coerce.number().optional().default(20),
      }),
    },
    responses: {
      200: {
        description: "Followers retrieved successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                followers: z.array(FollowerSchema),
                pagination: PaginationSchema,
              })
              .openapi("GetFollowersResponse"),
          },
        },
      },
    },
  })

  app.openapi(getFollowersRoute, async (c) => {
    const { userId } = c.req.param()
    const query = c.req.valid("query")
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 50)
    const offset = (page - 1) * limit

    const db = c.get("db")
    const authSession = c.get("session")
    const user = c.get("user")

    const [data] = await db
      .select({ total: count() })
      .from(schema.follow)
      .where(eq(schema.follow.followingId, userId))

    const total = data?.total ?? 0

    const followers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        image: schema.users.image,
        userId: schema.userProfile.userId,
        username: schema.userProfile.username,
        bio: schema.userProfile.bio,
        location: schema.userProfile.location,
        website: schema.userProfile.website,
        followersCount: schema.userProfile.followersCount,
        followingCount: schema.userProfile.followingCount,
        lessonsCount: schema.userProfile.lessonsCount,
      })
      .from(schema.follow)
      .innerJoin(schema.users, eq(schema.users.id, schema.follow.followerId))
      .leftJoin(
        schema.userProfile,
        eq(schema.userProfile.userId, schema.follow.followerId)
      )
      .where(eq(schema.follow.followingId, userId))
      .limit(limit)
      .offset(offset)

    const followersWithFollowing = await Promise.all(
      followers
        .filter(
          (
            follower
          ): follower is typeof followers[number] & {
            userId: string
            followingCount: number
            lessonsCount: number
          } =>
            follower.userId !== null &&
            follower.followingCount !== null &&
            follower.lessonsCount !== null
        )
        .map(async (follower) => {
          let isFollowing = false
          if (authSession && user) {
            const [followRecord] = await db
              .select()
              .from(schema.follow)
              .where(
                and(
                  eq(schema.follow.followerId, user.id),
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

    return c.json({
      followers: followersWithFollowing,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  /**
   * GET /api/profile/user/:userId/following
   * Get following list
   */
  const getFollowingRoute = createRoute({
    method: "get",
    path: "/api/profile/user/{userId}/following",
    summary: "Get following",
    description: "Get users that a user is following with pagination",
    tags: ["Profile"],
    request: {
      params: z.object({
        userId: z.string(),
      }),
      query: z.object({
        page: z.coerce.number().optional().default(1),
        limit: z.coerce.number().optional().default(20),
      }),
    },
    responses: {
      200: {
        description: "Following retrieved successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                following: z.array(FollowerSchema),
                pagination: PaginationSchema,
              })
              .openapi("GetFollowingResponse"),
          },
        },
      },
    },
  })

  app.openapi(getFollowingRoute, async (c) => {
    const { userId } = c.req.param()
    const query = c.req.valid("query")
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 50)
    const offset = (page - 1) * limit

    const db = c.get("db")
    const authSession = c.get("session")
    const user = c.get("user")

    const [data] = await db
      .select({ total: count() })
      .from(schema.follow)
      .where(eq(schema.follow.followerId, userId))

    const total = data?.total ?? 0

    const following = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        image: schema.users.image,
        userId: schema.userProfile.userId,
        username: schema.userProfile.username,
        bio: schema.userProfile.bio,
        location: schema.userProfile.location,
        website: schema.userProfile.website,
        followersCount: schema.userProfile.followersCount,
        followingCount: schema.userProfile.followingCount,
        lessonsCount: schema.userProfile.lessonsCount,
      })
      .from(schema.follow)
      .innerJoin(schema.users, eq(schema.users.id, schema.follow.followingId))
      .leftJoin(
        schema.userProfile,
        eq(schema.userProfile.userId, schema.follow.followingId)
      )
      .where(eq(schema.follow.followerId, userId))
      .limit(limit)
      .offset(offset)

    const followingWithFollowing = await Promise.all(
      following
        .filter(
          (item): item is typeof following[number] & {
            userId: string
            followingCount: number
            lessonsCount: number
          } =>
            item.userId !== null &&
            item.followingCount !== null &&
            item.lessonsCount !== null
        )
        .map(async (item) => {
          let isFollowing = false
          if (authSession && user) {
            const [followRecord] = await db
              .select()
              .from(schema.follow)
              .where(
                and(
                  eq(schema.follow.followerId, user.id),
                  eq(schema.follow.followingId, item.id)
                )
              )
            isFollowing = !!followRecord
          }
          return {
            ...item,
            isFollowing,
          }
        })
    )

    return c.json({
      following: followingWithFollowing,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  return app
}
