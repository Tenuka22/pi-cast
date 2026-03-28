"use server"

import {
  postApiProfileFollow,
  putApiProfileMe,
  postApiProfileCreatorRole,
} from "@/lib/api/profile/profile"
import type { ToggleFollow, UpdateProfile, RequestCreatorRole } from "@/lib/api/schemas"

/**
 * Server actions for profile mutations
 * These are called from client components to perform authenticated actions
 */

export async function toggleFollow(userId: string) {
  try {
    const payload: ToggleFollow = { userId }
    const result = await postApiProfileFollow(payload)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle follow",
    }
  }
}

export async function updateProfile(input: {
  name?: string
  username?: string
  bio?: string
  location?: string
  website?: string
  image?: string
}) {
  try {
    const payload: UpdateProfile = input
    const result = await putApiProfileMe(payload)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

export async function requestCreatorRole() {
  try {
    const payload: RequestCreatorRole = {}
    const result = await postApiProfileCreatorRole(payload)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to become a creator",
    }
  }
}
