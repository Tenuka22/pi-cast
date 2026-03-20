export {
  getProfile,
  getVerifiedProfile,
  getAdminData,
  getPublicData,
} from "./protected"

export {
  adminGetUsers,
  adminUpdateUserRole,
  adminBanUser,
  adminGetReviewQueue,
  adminUpdateLessonStatus,
  adminGetPlatformStats,
} from "./admin"

export {
  studentGetEnrolledLessons,
  studentGetLessonProgress,
  studentUpdateProgress,
  studentGetBookmarks,
  studentCreateBookmark,
  studentUpdateBookmark,
  studentDeleteBookmark,
  studentGetNotes,
  studentCreateNote,
  studentUpdateNote,
  studentDeleteNote,
  studentGetWatchHistory,
  studentRecordView,
  studentGetDashboardStats,
} from "./student"
