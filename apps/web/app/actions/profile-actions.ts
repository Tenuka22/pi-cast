"use server"

import { orpc } from "@/lib/server-orpc-client"

/**
 * Server actions for profile mutations
 * These are called from client components to perform authenticated actions
 */

export async function toggleFollow(userId: string) {
  try {
    const result = await orpc.profileToggleFollow(userId)
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
    const result = await orpc.profileUpdateMyProfile(input)
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
    const result = await orpc.profileRequestCreatorRole({})
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to become a creator",
    }
  }
}
