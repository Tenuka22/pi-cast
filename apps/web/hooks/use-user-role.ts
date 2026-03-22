"use client"

import { useSession } from "@/lib/auth/auth-client"
import { useMemo } from "react"

/**
 * User role types
 */
export type UserRole = "student" | "creator" | "admin"

/**
 * Hook to check user role and permissions
 *
 * @example
 * ```tsx
 * const { isCreator, isAdmin, canRecord, canCreateOrg } = useUserRole();
 *
 * if (!canRecord) {
 *   return <div>Upgrade to creator to record</div>;
 * }
 * ```
 */
export function useUserRole() {
  const { data: session } = useSession()
  const user = session?.user

  const role: UserRole = useMemo(() => {
    if (!user?.role) return "student"

    if (user.role === "admin") return "admin"
    if (user.role === "creator") return "creator"
    return "student"
  }, [user?.role])

  const isAdmin = role === "admin"
  const isCreator = role === "creator" || isAdmin
  const isStudent = role === "student"

  /**
   * Check if user can record lessons
   * Only admins and creators can record
   */
  const canRecord = isAdmin || isCreator

  /**
   * Check if user can create organizations
   * Only admins and creators can create orgs
   */
  const canCreateOrg = isAdmin || isCreator

  /**
   * Check if user can publish lessons
   * Only admins and creators can publish
   */
  const canPublish = isAdmin || isCreator

  /**
   * Check if user has specific role
   */
  const hasRole = (requiredRole: UserRole) => {
    if (requiredRole === "student") return true
    if (requiredRole === "creator") return isCreator
    if (requiredRole === "admin") return isAdmin
    return false
  }

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]) => {
    return roles.some(hasRole)
  }

  return {
    role,
    isAdmin,
    isCreator,
    isStudent,
    canRecord,
    canCreateOrg,
    canPublish,
    hasRole,
    hasAnyRole,
    user,
  }
}
