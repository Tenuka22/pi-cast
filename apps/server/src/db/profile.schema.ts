/**
 * Profile Schema
 *
 * Extended user profile fields and follow system.
 */

import { relations, sql } from "drizzle-orm"
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core"
import { users } from "./auth.schema"

/**
 * User Profile Table
 */
export const userProfile = sqliteTable(
  "user_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    username: text("username").unique(),
    bio: text("bio"),
    location: text("location"),
    website: text("website"),

    followersCount: integer("followers_count").default(0).notNull(),
    followingCount: integer("following_count").default(0).notNull(),
    lessonsCount: integer("lessons_count").default(0).notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("user_profile_username_idx").on(table.username)]
)

/**
 * Follow System Table
 */
export const follow = sqliteTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follow_follower_idx").on(table.followerId),
    index("follow_following_idx").on(table.followingId),
  ]
)

/**
 * Lesson System Tables
 */
export const lesson = sqliteTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    })
      .default("draft")
      .notNull(),
    level: text("level", {
      enum: ["beginner", "intermediate", "advanced"],
    }),
    duration: integer("duration"),
    viewCount: integer("view_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("lesson_creator_idx").on(table.creatorId),
    index("lesson_status_idx").on(table.status),
    index("lesson_creator_status_idx").on(table.creatorId, table.status),
  ]
)

/**
 * Lesson Bookmark Table
 */
export const lessonBookmark = sqliteTable(
  "lesson_bookmark",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    timestamp: integer("timestamp").notNull(),
    label: text("label"),
    isPublic: integer("is_public", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("lesson_bookmark_lesson_idx").on(table.lessonId),
    index("lesson_bookmark_user_idx").on(table.userId),
    index("lesson_bookmark_creator_idx").on(table.userId),
  ]
)

/**
 * Lesson Like Table
 */
export const lessonLike = sqliteTable(
  "lesson_like",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("lesson_like_lesson_idx").on(table.lessonId),
    index("lesson_like_user_idx").on(table.userId),
    uniqueIndex("lesson_like_unique").on(table.lessonId, table.userId),
  ]
)

// Relations
export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(users, {
    fields: [userProfile.userId],
    references: [users.id],
  }),
}))

export const followRelations = relations(follow, ({ one }) => ({
  follower: one(users, {
    fields: [follow.followerId],
    references: [users.id],
    relationName: "follow_follower",
  }),
  following: one(users, {
    fields: [follow.followingId],
    references: [users.id],
    relationName: "follow_following",
  }),
}))

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  creator: one(users, {
    fields: [lesson.creatorId],
    references: [users.id],
  }),
  bookmarks: many(lessonBookmark),
  likes: many(lessonLike),
}))

export const lessonBookmarkRelations = relations(lessonBookmark, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonBookmark.lessonId],
    references: [lesson.id],
  }),
  user: one(users, {
    fields: [lessonBookmark.userId],
    references: [users.id],
  }),
}))

export const lessonLikeRelations = relations(lessonLike, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonLike.lessonId],
    references: [lesson.id],
  }),
  user: one(users, {
    fields: [lessonLike.userId],
    references: [users.id],
  }),
}))

// User relations extensions (for follow system) - commented out to avoid conflicts with auth schema
// export const userFollowRelations = relations(user, ({ many }) => ({
//   followers: many(follow, { relationName: "follow_following" }),
//   following: many(follow, { relationName: "follow_follower" }),
//   lessons: many(lesson),
//   bookmarks: many(lessonBookmark),
//   likes: many(lessonLike),
// }))
