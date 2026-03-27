import { DrizzleD1Database } from "drizzle-orm/d1"
import * as schema from "../db/schema"
import { eq } from "drizzle-orm"

/**
 * Generate a unique username from email
 */
export async function generateUniqueUsername(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  email: string
): Promise<string> {
  const baseUsername = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "user"

  let username = baseUsername
  let counter = 1

  while (true) {
    const [existing] = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.username, username))

    if (!existing) {
      return username
    }

    username = `${baseUsername}_${counter}`
    counter++

    if (counter > 1000) {
      throw new Error("Unable to generate unique username")
    }
  }
}
