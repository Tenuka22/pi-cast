/**
 * Profile Schema
 *
 * Extended user profile fields and follow system.
 * This schema is separate from auth.schema.ts (auto-generated).
 */

import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth.schema";

/**
 * User Profile Table
 *
 * Extended profile fields for users.
 * Separated from auth schema to allow independent evolution.
 */
export const userProfile = sqliteTable("user_profile", {
  // Primary key is also FK to user table
  userId: text("user_id")
    .primaryKey()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Public profile fields
  username: text("username").unique(),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),

  // Profile stats (denormalized for performance)
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  lessonsCount: integer("lessons_count").default(0).notNull(),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [uniqueIndex("user_profile_username_idx").on(table.username)]);

/**
 * Follow System Table
 *
 * Many-to-many relationship for user follows.
 */
export const follow = sqliteTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follow_follower_idx").on(table.followerId),
    index("follow_following_idx").on(table.followingId),
  ]
);

/**
 * Lesson System Tables (for profile page lesson display)
 */
export const lesson = sqliteTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    // Creator reference
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Status
    status: text("status", {
      enum: ["draft", "published", "archived"],
    })
      .default("draft")
      .notNull(),
    // Metadata
    level: text("level", {
      enum: ["beginner", "intermediate", "advanced"],
    }),
    duration: integer("duration"), // in seconds
    viewCount: integer("view_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("lesson_creator_idx").on(table.creatorId),
    index("lesson_status_idx").on(table.status),
    index("lesson_creator_status_idx").on(table.creatorId, table.status),
  ]
);

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
      .references(() => user.id, { onDelete: "cascade" }),
    timestamp: integer("timestamp").notNull(), // in milliseconds
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
);

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
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("lesson_like_lesson_idx").on(table.lessonId),
    index("lesson_like_user_idx").on(table.userId),
    uniqueIndex("lesson_like_unique").on(table.lessonId, table.userId),
  ]
);

// Relations
export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));

export const followRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "follow_follower",
  }),
  following: one(user, {
    fields: [follow.followingId],
    references: [user.id],
    relationName: "follow_following",
  }),
}));

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  creator: one(user, {
    fields: [lesson.creatorId],
    references: [user.id],
  }),
  bookmarks: many(lessonBookmark),
  likes: many(lessonLike),
}));

export const lessonBookmarkRelations = relations(lessonBookmark, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonBookmark.lessonId],
    references: [lesson.id],
  }),
  user: one(user, {
    fields: [lessonBookmark.userId],
    references: [user.id],
  }),
}));

export const lessonLikeRelations = relations(lessonLike, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonLike.lessonId],
    references: [lesson.id],
  }),
  user: one(user, {
    fields: [lessonLike.userId],
    references: [user.id],
  }),
}));

// User relations extensions (for follow system)
export const userFollowRelations = relations(user, ({ many }) => ({
  followers: many(follow, { relationName: "follow_following" }),
  following: many(follow, { relationName: "follow_follower" }),
  lessons: many(lesson),
  bookmarks: many(lessonBookmark),
  likes: many(lessonLike),
}));
