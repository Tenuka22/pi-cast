# 📊 Database Schema Documentation

Complete database schema reference for pi-cast.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [User Management Tables](#user-management-tables)
5. [Organization Tables](#organization-tables)
6. [Content Tables](#content-tables)
7. [Indexes](#indexes)

---

## Overview

pi-cast uses **SQLite** with **libsql** as the database engine, managed through **Drizzle ORM**.

### Database Configuration

- **Engine**: SQLite (libsql)
- **ORM**: Drizzle ORM 0.45.x
- **Location**: `packages/db/sqlite.db` (development)
- **Migrations**: `packages/db/drizzle/`

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      user       │       │   organization  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ email (UNQ)     │       │ slug (UNQ)      │
│ email_verified  │       │ logo            │
│ image           │       │ created_at      │
│ bio             │       │ metadata        │
│ location        │       └────────┬────────┘
│ website         │                │
│ role            │                │
│ banned          │       ┌────────┴────────┐
│ created_at      │       │     member      │
│ updated_at      │       ├─────────────────┤
└────────┬────────┘       │ id (PK)         │
         │                │ user_id (FK)    │
         │                │ org_id (FK)     │
         │                │ role            │
         │                │ created_at      │
         │                └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │    invitation   │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ org_id (FK)     │
         │       │ email           │
         │       │ role            │
         │       │ status          │
         │       │ expires_at      │
         │       │ inviter_id (FK) │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │     session     │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ user_id (FK)    │
         │       │ token (UNQ)     │
         │       │ expires_at      │
         │       │ created_at      │
         │       │ updated_at      │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │     account     │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ user_id (FK)    │
         │       │ provider_id     │
         │       │ account_id      │
         │       │ access_token    │
         │       │ created_at      │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │  verification   │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ identifier      │
         │       │ value           │
         │       │ expires_at      │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │     lesson      │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ creator_id (FK) │
         │       │ title           │
         │       │ description     │
         │       │ status          │
         │       │ visibility      │
         │       │ level           │
         │       │ created_at      │
         │       │ updated_at      │
         │       └────────┬────────┘
         │                │
         │       ┌────────┴────────┐
         │       │  lesson_block   │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ lesson_id (FK)  │
         │       │ type            │
         │       │ position        │
         │       │ dimensions      │
         │       │ data            │
         │       │ order           │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │lesson_recording │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ lesson_id (FK)  │
         │       │ events (JSON)   │
         │       │audio_segments   │
         │       │ duration        │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │ lesson_bookmark │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ lesson_id (FK)  │
         │       │ creator_id (FK) │
         │       │ title           │
         │       │ timestamp       │
         │       │ type            │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │   lesson_note   │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ lesson_id (FK)  │
         │       │ user_id (FK)    │
         │       │ content         │
         │       │ timestamp       │
         │       │ is_private      │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │lesson_enrollment│
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ lesson_id (FK)  │
         │       │ user_id (FK)    │
         │       │ progress        │
         │       │ is_completed    │
         │       │ enrolled_at     │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │     category    │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ name            │
         │       │ slug (UNQ)      │
         │       │ parent_id (FK)  │
         │       │ is_featured     │
         │       └─────────────────┘
         │
         │       ┌─────────────────┐
         │       │      course     │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ creator_id (FK) │
         │       │ title           │
         │       │ description     │
         │       │ is_published    │
         │       │ is_free         │
         │       │ price           │
         │       └────────┬────────┘
         │                │
         │       ┌────────┴────────┐
         │       │  course_lesson  │
         │       ├─────────────────┤
         │       │ id (PK)         │
         │       │ course_id (FK)  │
         │       │ lesson_id (FK)  │
         │       │ order           │
         │       │ is_locked       │
         │       └─────────────────┘
         │
         └─────────────────────────┘
```

---

## Core Tables

### user

User accounts and profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | User ID |
| name | text | NOT NULL | Display name |
| email | text | NOT NULL, UNIQUE | Email address |
| email_verified | integer | DEFAULT false | Email verification status |
| image | text | NULL | Profile image URL |
| bio | text | NULL | User biography |
| location | text | NULL | User location |
| website | text | NULL | User website URL |
| role | text | NULL | User role (student/teacher/admin) |
| banned | integer | DEFAULT false | Ban status |
| ban_reason | text | NULL | Reason for ban |
| ban_expires | integer | NULL | Ban expiration timestamp |
| created_at | integer | NOT NULL | Account creation timestamp |
| updated_at | integer | NOT NULL | Last update timestamp |

**Indexes:**
- `user_email_idx` (email) - UNIQUE
- `user_role_idx` (role)
- `user_created_at_idx` (created_at)

---

### session

User authentication sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Session ID |
| user_id | text | NOT NULL, FK → user.id | User reference |
| token | text | NOT NULL, UNIQUE | Session token |
| expires_at | integer | NOT NULL | Session expiration |
| created_at | integer | NOT NULL | Session creation |
| updated_at | integer | NOT NULL | Last update |
| ip_address | text | NULL | Client IP address |
| user_agent | text | NULL | Client user agent |
| active_organization_id | text | NULL | Active organization |
| impersonated_by | text | NULL | Admin impersonation |

**Indexes:**
- `session_token_idx` (token) - UNIQUE
- `session_userId_idx` (user_id)
- `session_expires_at_idx` (expires_at)

---

### account

OAuth and external account connections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Account ID |
| user_id | text | NOT NULL, FK → user.id | User reference |
| provider_id | text | NOT NULL | OAuth provider |
| account_id | text | NOT NULL | Provider account ID |
| access_token | text | NULL | OAuth access token |
| refresh_token | text | NULL | OAuth refresh token |
| access_token_expires_at | integer | NULL | Access token expiry |
| scope | text | NULL | OAuth scope |
| created_at | integer | NOT NULL | Connection creation |
| updated_at | integer | NOT NULL | Last update |

**Indexes:**
- `account_userId_idx` (user_id)
- `account_provider_idx` (provider_id, account_id)

---

## User Management Tables

### verification

Email verification codes and tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Verification ID |
| identifier | text | NOT NULL | Email or phone |
| value | text | NOT NULL | Verification code/token |
| expires_at | integer | NOT NULL | Expiration timestamp |
| created_at | integer | NOT NULL | Creation timestamp |
| updated_at | integer | NOT NULL | Last update |

**Indexes:**
- `verification_identifier_idx` (identifier)
- `verification_value_idx` (value)
- `verification_expires_at_idx` (expires_at)

---

## Organization Tables

### organization

Organizations (schools, companies, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Organization ID |
| name | text | NOT NULL | Organization name |
| slug | text | NOT NULL, UNIQUE | URL-friendly identifier |
| logo | text | NULL | Organization logo URL |
| created_at | integer | NOT NULL | Creation timestamp |
| metadata | text | NULL | Additional metadata (JSON) |

**Indexes:**
- `organization_slug_uidx` (slug) - UNIQUE
- `organization_created_at_idx` (created_at)

---

### member

Organization memberships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Membership ID |
| user_id | text | NOT NULL, FK → user.id | User reference |
| organization_id | text | NOT NULL, FK → organization.id | Organization reference |
| role | text | DEFAULT 'member' | Member role (owner/admin/member) |
| created_at | integer | NOT NULL | Join timestamp |

**Indexes:**
- `member_userId_idx` (user_id)
- `member_organizationId_idx` (organization_id)
- `member_user_org_idx` (user_id, organization_id) - UNIQUE

---

### invitation

Organization invitations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Invitation ID |
| organization_id | text | NOT NULL, FK → organization.id | Organization reference |
| email | text | NOT NULL | Invitee email |
| role | text | NULL | Invited role |
| status | text | DEFAULT 'pending' | Invitation status |
| expires_at | integer | NOT NULL | Expiration timestamp |
| created_at | integer | NOT NULL | Creation timestamp |
| inviter_id | text | NOT NULL, FK → user.id | Inviter reference |

**Indexes:**
- `invitation_email_idx` (email)
- `invitation_organizationId_idx` (organization_id)
- `invitation_email_status_idx` (email, status)

---

## Content Tables

### lesson

Lessons created by teachers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Lesson ID |
| creator_id | text | NOT NULL, FK → user.id | Teacher reference |
| creator_name | text | NOT NULL | Teacher name (denormalized) |
| title | text | NOT NULL | Lesson title |
| description | text | NOT NULL | Lesson description |
| status | text | DEFAULT 'draft' | draft/published/archived/deleted |
| visibility | text | DEFAULT 'private' | public/private/organization/unlisted |
| level | text | DEFAULT 'all' | beginner/intermediate/advanced/all |
| thumbnail_url | text | NULL | Thumbnail image URL |
| duration | integer | NULL | Estimated duration (minutes) |
| tags | text | NULL | Tags (JSON array) |
| category_id | text | NULL, FK → category.id | Category reference |
| organization_id | text | NULL | Organization reference |
| views | integer | DEFAULT 0 | View count |
| completions | integer | DEFAULT 0 | Completion count |
| average_rating | integer | DEFAULT 0 | Average rating (0-5) |
| total_ratings | integer | DEFAULT 0 | Rating count |
| created_at | integer | NOT NULL | Creation timestamp |
| updated_at | integer | NOT NULL | Last update |
| published_at | integer | NULL | Publication timestamp |
| last_accessed_at | integer | NULL | Last access timestamp |
| version | integer | DEFAULT 1 | Version number |
| parent_lesson_id | text | NULL | Parent lesson for revisions |

**Indexes:**
- `lesson_creatorId_idx` (creator_id)
- `lesson_status_idx` (status)
- `lesson_visibility_idx` (visibility)
- `lesson_categoryId_idx` (category_id)
- `lesson_creator_status_idx` (creator_id, status)
- `lesson_created_at_idx` (created_at)
- `lesson_published_at_idx` (published_at)
- `lesson_views_idx` (views)
- `lesson_rating_idx` (average_rating)

---

### lesson_block

Blocks within a lesson.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Block ID |
| lesson_id | text | NOT NULL, FK → lesson.id | Lesson reference |
| type | text | NOT NULL | equation/chart/control/description/group |
| position | text | NOT NULL | Grid position (JSON) |
| dimensions | text | NOT NULL | Block dimensions (JSON) |
| data | text | NOT NULL | Block data (JSON) |
| order | integer | NOT NULL | Display order |

**Indexes:**
- `lessonBlock_lessonId_idx` (lesson_id)
- `lesson_block_lesson_order_idx` (lesson_id, order)

---

### lesson_recording

Recording data for a lesson.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Recording ID |
| lesson_id | text | NOT NULL, FK → lesson.id | Lesson reference |
| title | text | NOT NULL | Recording title |
| description | text | NULL | Recording description |
| events | text | NOT NULL | Events (JSON array) |
| audio_segments | text | NOT NULL | Audio segments (JSON) |
| duration | integer | NOT NULL | Duration (milliseconds) |
| created_at | integer | NOT NULL | Creation timestamp |
| created_by | text | NOT NULL | Creator ID |

**Indexes:**
- `lessonRecording_lessonId_idx` (lesson_id)

---

### lesson_bookmark

Bookmarks within lessons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Bookmark ID |
| lesson_id | text | NOT NULL, FK → lesson.id | Lesson reference |
| recording_id | text | NULL | Recording reference |
| creator_id | text | NOT NULL, FK → user.id | Creator reference |
| title | text | NOT NULL | Bookmark title |
| description | text | NULL | Bookmark description |
| timestamp | integer | NOT NULL | Position in recording (ms) |
| type | text | NOT NULL | teacher/student |
| color | text | NULL | Bookmark color |
| created_at | integer | NOT NULL | Creation timestamp |

**Indexes:**
- `lessonBookmark_lessonId_idx` (lesson_id)
- `lessonBookmark_creatorId_idx` (creator_id)
- `lesson_bookmark_lesson_timestamp_idx` (lesson_id, timestamp)

---

### lesson_note

Student notes on lessons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Note ID |
| lesson_id | text | NOT NULL, FK → lesson.id | Lesson reference |
| user_id | text | NOT NULL, FK → user.id | User reference |
| content | text | NOT NULL | Note content |
| timestamp | integer | NOT NULL | Position in recording (ms) |
| is_private | integer | DEFAULT true | Privacy flag |
| created_at | integer | NOT NULL | Creation timestamp |
| updated_at | integer | NOT NULL | Last update |

**Indexes:**
- `lessonNote_lessonId_idx` (lesson_id)
- `lessonNote_userId_idx` (user_id)
- `lesson_note_lesson_user_idx` (lesson_id, user_id)

---

### lesson_enrollment

Student enrollments in lessons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Enrollment ID |
| lesson_id | text | NOT NULL, FK → lesson.id | Lesson reference |
| user_id | text | NOT NULL, FK → user.id | User reference |
| progress | integer | DEFAULT 0 | Progress percentage (0-100) |
| current_bookmark_id | text | NULL | Current bookmark |
| completed_bookmarks | text | NULL | Completed bookmarks (JSON) |
| is_completed | integer | DEFAULT false | Completion flag |
| completed_at | integer | NULL | Completion timestamp |
| enrolled_at | integer | NOT NULL | Enrollment timestamp |
| last_accessed_at | integer | NOT NULL | Last access timestamp |
| total_watch_time | integer | DEFAULT 0 | Total watch time (minutes) |

**Indexes:**
- `lessonEnrollment_lessonId_idx` (lesson_id)
- `lessonEnrollment_userId_idx` (user_id)
- `lesson_enrollment_user_lessons_idx` (user_id, lesson_id) - UNIQUE
- `lesson_enrollment_progress_idx` (progress)
- `lesson_enrollment_completed_idx` (is_completed)

---

### category

Lesson categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Category ID |
| name | text | NOT NULL | Category name |
| slug | text | NOT NULL, UNIQUE | URL-friendly identifier |
| description | text | NULL | Category description |
| icon | text | NULL | Category icon |
| color | text | NULL | Category color |
| parent_category_id | text | NULL, FK → category.id | Parent category |
| order | integer | DEFAULT 0 | Display order |
| is_featured | integer | DEFAULT false | Featured flag |
| lesson_count | integer | DEFAULT 0 | Lesson count |

**Indexes:**
- `category_slug_idx` (slug) - UNIQUE
- `category_parent_idx` (parent_category_id)
- `category_featured_idx` (is_featured)

---

### course

Course/playlist collections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Course ID |
| creator_id | text | NOT NULL, FK → user.id | Creator reference |
| creator_name | text | NOT NULL | Creator name |
| title | text | NOT NULL | Course title |
| description | text | NOT NULL | Course description |
| thumbnail_url | text | NULL | Thumbnail URL |
| organization_id | text | NULL | Organization reference |
| level | text | DEFAULT 'all' | Difficulty level |
| tags | text | NULL | Tags (JSON) |
| category_id | text | NULL, FK → category.id | Category reference |
| total_duration | integer | DEFAULT 0 | Total duration (minutes) |
| enrolled_students | integer | DEFAULT 0 | Enrollment count |
| average_rating | integer | DEFAULT 0 | Average rating |
| total_ratings | integer | DEFAULT 0 | Rating count |
| is_published | integer | DEFAULT false | Publication flag |
| is_free | integer | DEFAULT true | Free flag |
| price | integer | NULL | Price in cents |
| created_at | integer | NOT NULL | Creation timestamp |
| updated_at | integer | NOT NULL | Last update |
| published_at | integer | NULL | Publication timestamp |

**Indexes:**
- `course_creatorId_idx` (creator_id)
- `course_categoryId_idx` (category_id)
- `course_published_idx` (is_published)

---

### course_lesson

Lessons within a course.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Course-lesson ID |
| course_id | text | NOT NULL, FK → course.id | Course reference |
| lesson_id | text | NOT NULL, FK → lesson.id | Lesson reference |
| order | integer | NOT NULL | Lesson order |
| title | text | NOT NULL | Lesson title |
| description | text | NULL | Lesson description |
| duration | integer | NULL | Lesson duration |
| is_locked | integer | DEFAULT false | Lock flag |
| prerequisites | text | NULL | Prerequisites (JSON) |

**Indexes:**
- `courseLesson_courseId_idx` (course_id)
- `courseLesson_lessonId_idx` (lesson_id)
- `course_lesson_course_order_idx` (course_id, order)

---

## Indexes Summary

### Performance Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| user | user_email_idx | email | Fast email lookup |
| user | user_role_idx | role | Role-based queries |
| user | user_created_at_idx | created_at | Date-based queries |
| session | session_token_idx | token | Session validation |
| session | session_userId_idx | user_id | User sessions |
| lesson | lesson_creator_status_idx | creator_id, status | Teacher's lessons |
| lesson | lesson_views_idx | views | Popular lessons |
| lesson_enrollment | lesson_enrollment_user_lessons_idx | user_id, lesson_id | User enrollment check |
| lesson_bookmark | lesson_bookmark_lesson_timestamp_idx | lesson_id, timestamp | Bookmark navigation |

---

*Last Updated: March 2026*
*Version: 1.0.0*
