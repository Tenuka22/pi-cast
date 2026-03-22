import { type RouterClient } from "@orpc/server"
import { getAdminData, getProfile, getVerifiedProfile } from "./protected"
import {
  profileGetFollowers,
  profileGetFollowing,
  profileGetMyProfile,
  profileGetPublicProfile,
  profileGetUserLessons,
  profileRequestCreatorRole,
  profileToggleFollow,
  profileUpdateMyProfile,
} from "./profile"

export const rpcHandler = {
  getProfile,
  getVerifiedProfile,
  getAdminData,
  profileGetMyProfile,
  profileUpdateMyProfile,
  profileGetPublicProfile,
  profileGetUserLessons,
  profileToggleFollow,
  profileRequestCreatorRole,
  profileGetFollowers,
  profileGetFollowing,
}

export type RouterClientType = RouterClient<typeof rpcHandler>
