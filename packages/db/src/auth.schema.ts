import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = sqliteTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// ============================================================================
// LESSON SYSTEM SCHEMA
// ============================================================================

export const lesson = sqliteTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status", { enum: ["draft", "published", "archived", "deleted"] })
      .default("draft")
      .notNull(),
    visibility: text("visibility", { enum: ["public", "private", "organization", "unlisted"] })
      .default("private")
      .notNull(),
    level: text("level", { enum: ["beginner", "intermediate", "advanced", "all"] })
      .default("all")
      .notNull(),
    thumbnailUrl: text("thumbnail_url"),
    duration: integer("duration"), // Estimated duration in minutes
    tags: text("tags"), // JSON array of tags
    categoryId: text("category_id"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    creatorName: text("creator_name").notNull(),
    organizationId: text("organization_id"),
    views: integer("views").default(0).notNull(),
    completions: integer("completions").default(0).notNull(),
    averageRating: integer("average_rating").default(0).notNull(),
    totalRatings: integer("total_ratings").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    lastAccessedAt: integer("last_accessed_at", { mode: "timestamp_ms" }),
    version: integer("version").default(1).notNull(),
    parentLessonId: text("parent_lesson_id"), // For revisions
  },
  (table) => [
    index("lesson_creatorId_idx").on(table.creatorId),
    index("lesson_status_idx").on(table.status),
    index("lesson_visibility_idx").on(table.visibility),
    index("lesson_categoryId_idx").on(table.categoryId),
  ]
);

export const lessonBlock = sqliteTable(
  "lesson_block",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["equation", "chart", "control", "description", "group"] })
      .notNull(),
    position: text("position").notNull(), // JSON { x: number, y: number }
    dimensions: text("dimensions").notNull(), // JSON { width: number, height: number }
    data: text("data").notNull(), // JSON block data
    order: integer("order").notNull(),
  },
  (table) => [index("lessonBlock_lessonId_idx").on(table.lessonId)]
);

export const lessonRecording = sqliteTable(
  "lesson_recording",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    events: text("events").notNull(), // JSON array of recording events
    audioSegments: text("audio_segments").notNull(), // JSON array of audio segment references
    duration: integer("duration").notNull(), // Duration in milliseconds
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    createdBy: text("created_by").notNull(),
  },
  (table) => [index("lessonRecording_lessonId_idx").on(table.lessonId)]
);

export const lessonBookmark = sqliteTable(
  "lesson_bookmark",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    recordingId: text("recording_id"),
    title: text("title").notNull(),
    description: text("description"),
    timestamp: integer("timestamp").notNull(), // Position in recording in ms
    type: text("type", { enum: ["teacher", "student"] }).notNull(),
    color: text("color"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("lessonBookmark_lessonId_idx").on(table.lessonId),
    index("lessonBookmark_creatorId_idx").on(table.creatorId),
  ]
);

export const lessonNote = sqliteTable(
  "lesson_note",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    timestamp: integer("timestamp").notNull(), // Position in recording in ms
    isPrivate: integer("is_private", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lessonNote_lessonId_idx").on(table.lessonId),
    index("lessonNote_userId_idx").on(table.userId),
  ]
);

export const lessonEnrollment = sqliteTable(
  "lesson_enrollment",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    progress: integer("progress").default(0).notNull(), // 0-100 percentage
    currentBookmarkId: text("current_bookmark_id"),
    completedBookmarks: text("completed_bookmarks"), // JSON array of bookmark IDs
    isCompleted: integer("is_completed", { mode: "boolean" }).default(false).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    enrolledAt: integer("enrolled_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    lastAccessedAt: integer("last_accessed_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    totalWatchTime: integer("total_watch_time").default(0).notNull(), // In minutes
  },
  (table) => [
    index("lessonEnrollment_lessonId_idx").on(table.lessonId),
    index("lessonEnrollment_userId_idx").on(table.userId),
    uniqueIndex("lessonEnrollment_lessonId_userId_uidx").on(table.lessonId, table.userId),
  ]
);

export const category = sqliteTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    parentCategoryId: text("parent_category_id"),
    order: integer("order").default(0).notNull(),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false).notNull(),
    lessonCount: integer("lesson_count").default(0).notNull(),
  },
  (table) => [index("category_parentCategoryId_idx").on(table.parentCategoryId)]
);

export const course = sqliteTable(
  "course",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    creatorName: text("creator_name").notNull(),
    organizationId: text("organization_id"),
    level: text("level", { enum: ["beginner", "intermediate", "advanced", "all"] })
      .default("all")
      .notNull(),
    tags: text("tags"), // JSON array of tags
    categoryId: text("category_id"),
    totalDuration: integer("total_duration").default(0).notNull(),
    enrolledStudents: integer("enrolled_students").default(0).notNull(),
    averageRating: integer("average_rating").default(0).notNull(),
    totalRatings: integer("total_ratings").default(0).notNull(),
    isPublished: integer("is_published", { mode: "boolean" }).default(false).notNull(),
    isFree: integer("is_free", { mode: "boolean" }).default(true).notNull(),
    price: integer("price"), // In cents
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("course_creatorId_idx").on(table.creatorId),
    index("course_categoryId_idx").on(table.categoryId),
  ]
);

export const courseLesson = sqliteTable(
  "course_lesson",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    duration: integer("duration"),
    isLocked: integer("is_locked", { mode: "boolean" }).default(false).notNull(),
    prerequisites: text("prerequisites"), // JSON array of lesson IDs
  },
  (table) => [
    index("courseLesson_courseId_idx").on(table.courseId),
    index("courseLesson_lessonId_idx").on(table.lessonId),
  ]
);

// ============================================================================
// LESSON SYSTEM RELATIONS
// ============================================================================

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  creator: one(user, {
    fields: [lesson.creatorId],
    references: [user.id],
  }),
  blocks: many(lessonBlock),
  recordings: many(lessonRecording),
  bookmarks: many(lessonBookmark),
  notes: many(lessonNote),
  enrollments: many(lessonEnrollment),
  courseLessons: many(courseLesson),
}));

export const lessonBlockRelations = relations(lessonBlock, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonBlock.lessonId],
    references: [lesson.id],
  }),
}));

export const lessonRecordingRelations = relations(lessonRecording, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonRecording.lessonId],
    references: [lesson.id],
  }),
}));

export const lessonBookmarkRelations = relations(lessonBookmark, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonBookmark.lessonId],
    references: [lesson.id],
  }),
  creator: one(user, {
    fields: [lessonBookmark.creatorId],
    references: [user.id],
  }),
}));

export const lessonNoteRelations = relations(lessonNote, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonNote.lessonId],
    references: [lesson.id],
  }),
  user: one(user, {
    fields: [lessonNote.userId],
    references: [user.id],
  }),
}));

export const lessonEnrollmentRelations = relations(lessonEnrollment, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonEnrollment.lessonId],
    references: [lesson.id],
  }),
  user: one(user, {
    fields: [lessonEnrollment.userId],
    references: [user.id],
  }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  lessons: many(lesson),
  parent: one(category, {
    fields: [category.parentCategoryId],
    references: [category.id],
  }),
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  creator: one(user, {
    fields: [course.creatorId],
    references: [user.id],
  }),
  lessons: many(courseLesson),
}));

export const courseLessonRelations = relations(courseLesson, ({ one }) => ({
  course: one(course, {
    fields: [courseLesson.courseId],
    references: [course.id],
  }),
  lesson: one(lesson, {
    fields: [courseLesson.lessonId],
    references: [lesson.id],
  }),
}));
