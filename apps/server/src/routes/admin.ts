import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi"
import { createSelectSchema } from "drizzle-zod"
import * as schema from "@/db/schema"
import { sql } from "drizzle-orm"
import { Context } from ".."

/**
 * Admin Routes
 */
export function createAdminRoutes() {
  const app = new OpenAPIHono<Context>()

  /**
   * GET /api/admin/users
   * Get all users (admin only)
   */
  const AdminUserSchema = createSelectSchema(schema.users)
    .pick({
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
    })
    .extend({
      id: z.string().openapi({ example: "user-123" }),
      name: z.string().openapi({ example: "John Doe" }),
      email: z.string().email().openapi({ example: "john@example.com" }),
      emailVerified: z.boolean().openapi({ example: true }),
      image: z.string().nullable().openapi({ example: "https://example.com/image.jpg" }),
      role: z.string().nullable().openapi({ example: "admin" }),
      createdAt: z.number().openapi({ example: 1234567890 }),
    })
    .openapi("AdminUser")

  const AdminPaginationSchema = z
    .object({
      page: z.number().openapi({ example: 1 }),
      limit: z.number().openapi({ example: 20 }),
      total: z.number().openapi({ example: 100 }),
      totalPages: z.number().openapi({ example: 5 }),
    })
    .openapi("AdminPagination")

  const AdminStatsSchema = z
    .object({
      totalUsers: z.number().openapi({ example: 1000 }),
      totalLessons: z.number().openapi({ example: 500 }),
      totalOrganizations: z.number().openapi({ example: 50 }),
    })
    .openapi("AdminStats")

  const getUsersRoute = createRoute({
    method: "get",
    path: "/api/admin/users",
    summary: "Get all users",
    description: "Get all users (admin only)",
    tags: ["Admin"],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        page: z.coerce.number().optional().default(1),
        limit: z.coerce.number().optional().default(20),
      }),
    },
    responses: {
      200: {
        description: "Users retrieved successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                users: z.array(AdminUserSchema),
                pagination: AdminPaginationSchema,
              })
              .openapi("GetUsersResponse"),
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      403: {
        description: "Forbidden - Admin access required",
      },
    },
  })

  app.openapi(getUsersRoute, async (c) => {
    const session = c.get("session")
    const user = c.get("user")
    if (!session) {
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

    // Check admin role
    if (user?.role !== "admin") {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin access required",
            status: 403,
          },
        },
        403
      )
    }

    const query = c.req.valid("query")
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 50)
    const offset = (page - 1) * limit

    const db = c.get("db")

    const users = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
      },
      limit,
      offset,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    })

    const total = users.length

    return c.json({
      users: users.map((user) => ({
        ...user,
        createdAt: user.createdAt?.getTime() || Date.now(),
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
   * GET /api/admin/stats
   * Get platform statistics (admin only)
   */
  const getStatsRoute = createRoute({
    method: "get",
    path: "/api/admin/stats",
    summary: "Get platform stats",
    description: "Get platform statistics (admin only)",
    tags: ["Admin"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Stats retrieved successfully",
        content: {
          "application/json": {
            schema: AdminStatsSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      403: {
        description: "Forbidden",
      },
    },
  })

  app.openapi(getStatsRoute, async (c) => {
    const session = c.get("session")
    const user = c.get("user")
    if (!session) {
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

    if (user?.role !== "admin") {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin access required",
            status: 403,
          },
        },
        403
      )
    }

    const db = c.get("db")

    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)

    const [totalLessons] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.lesson)

    return c.json({
      totalUsers: totalUsers?.count ?? 0,
      totalLessons: totalLessons?.count ?? 0,
      totalOrganizations: 0,
    })
  })

  return app
}
