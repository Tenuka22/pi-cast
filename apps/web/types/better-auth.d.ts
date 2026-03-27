/**
 * Better Auth Type Extensions
 * 
 * Extend Better Auth types with custom fields from our schema
 * Matches the server-side AuthUser type definition
 */

import "better-auth"
import "better-auth/client"
import "better-auth/react"

declare module "better-auth" {
  interface User {
    role?: "admin" | "teacher" | "user" | "creator" | "student" | null
  }
  
  interface Session {
    user: User & {
      role?: "admin" | "teacher" | "user" | "creator" | "student" | null
    }
  }
}

declare module "better-auth/client" {
  interface User {
    role?: "admin" | "teacher" | "user" | "creator" | "student" | null
  }
}

declare module "better-auth/react" {
  interface User {
    role?: "admin" | "teacher" | "user" | "creator" | "student" | null
  }
}
