/**
 * Server-side RPC Client
 * Provides server component access to API endpoints
 */

import {
  getApiProfileMe,
  getApiProfileUsername,
  getApiProfileUserUserIdLessons,
  postApiProfileFollow,
  postApiProfileCreatorRole,
  putApiProfileMe,
} from "@/lib/api/profile/profile"

import type {
  UpdateProfile,
  RequestCreatorRole,
} from "@/lib/api/schemas"

/**
 * Server-side client for profile API
 */
const profileClient = {
  getMyProfile: async () => {
    return getApiProfileMe({})
  },

  getPublicProfile: async (username: string) => {
    return getApiProfileUsername(username, {})
  },

  getUserLessons: async (userId: string) => {
    return getApiProfileUserUserIdLessons(userId, undefined, {})
  },

  toggleFollow: async (userId: string) => {
    return postApiProfileFollow({ userId }, {})
  },

  updateMyProfile: async (data: UpdateProfile) => {
    return putApiProfileMe(data, {})
  },

  requestCreatorRole: async (data: RequestCreatorRole) => {
    return postApiProfileCreatorRole(data, {})
  },
}

export const orpc = {
  profileGetMyProfile: profileClient.getMyProfile,
  profileGetPublicProfile: profileClient.getPublicProfile,
  profileGetUserLessons: profileClient.getUserLessons,
  profileToggleFollow: profileClient.toggleFollow,
  profileUpdateMyProfile: profileClient.updateMyProfile,
  profileRequestCreatorRole: profileClient.requestCreatorRole,
}
