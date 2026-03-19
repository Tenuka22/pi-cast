/**
 * Lesson Management System Types
 * 
 * Types and interfaces for lesson creation, organization, and discovery.
 */

// ============================================================================
// LESSON TYPES
// ============================================================================

export type LessonStatus = 'draft' | 'published' | 'archived' | 'deleted';
export type LessonVisibility = 'public' | 'private' | 'organization' | 'unlisted';
export type LessonLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  status: LessonStatus;
  visibility: LessonVisibility;
  level: LessonLevel;
  
  // Metadata
  thumbnailUrl?: string;
  duration?: number; // Estimated duration in minutes
  tags: string[];
  categoryId?: string;
  
  // Author
  creatorId: string;
  creatorName: string;
  organizationId?: string;
  
  // Content
  blocks: LessonBlock[];
  recordings?: LessonRecording[];
  bookmarks: LessonBookmark[];
  
  // Statistics
  views: number;
  completions: number;
  averageRating: number;
  totalRatings: number;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  lastAccessedAt?: number;
  
  // Versioning
  version: number;
  parentLessonId?: string; // For revisions
}

export interface LessonBlock {
  id: string;
  type: 'equation' | 'chart' | 'control' | 'description' | 'group';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  data: Record<string, unknown>;
  order: number;
}

export interface LessonRecording {
  id: string;
  title: string;
  description?: string;
  
  // Recording data
  events: RecordingEvent[];
  audioSegments: AudioSegmentReference[];
  duration: number;
  
  // Sync data
  blockStates: BlockStateSnapshot[];
  
  // Metadata
  createdAt: number;
  createdBy: string;
}

export interface RecordingEvent {
  id: string;
  timestamp: number;
  type: string;
  data: Record<string, unknown>;
}

export interface AudioSegmentReference {
  id: string;
  startTime: number;
  endTime: number;
  storageUrl: string;
  duration: number;
  isSilence: boolean;
}

export interface BlockStateSnapshot {
  blockId: string;
  timestamp: number;
  state: Record<string, unknown>;
}

export interface LessonBookmark {
  id: string;
  title: string;
  description?: string;
  timestamp: number; // Position in recording
  type: 'teacher' | 'student';
  color?: string;
}

// ============================================================================
// COURSE / PLAYLIST TYPES
// ============================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  
  // Organization
  lessons: CourseLesson[];
  totalDuration: number; // Sum of lesson durations
  
  // Author
  creatorId: string;
  creatorName: string;
  organizationId?: string;
  
  // Metadata
  level: LessonLevel;
  tags: string[];
  categoryId?: string;
  
  // Statistics
  enrolledStudents: number;
  averageRating: number;
  totalRatings: number;
  
  // Settings
  isPublished: boolean;
  isFree: boolean;
  price?: number;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export interface CourseLesson {
  lessonId: string;
  order: number;
  title: string;
  description?: string;
  duration?: number;
  isLocked: boolean;
  prerequisites?: string[]; // Lesson IDs that must be completed first
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parentCategoryId?: string;
  order: number;
  isFeatured: boolean;
  lessonCount: number;
}

// ============================================================================
// LESSON ENROLLMENT / PROGRESS TYPES
// ============================================================================

export interface LessonEnrollment {
  id: string;
  lessonId: string;
  userId: string;
  
  // Progress
  progress: number; // 0-100 percentage
  currentBookmarkId?: string;
  completedBookmarks: string[];
  notes: LessonNote[];
  
  // Status
  isCompleted: boolean;
  completedAt?: number;
  
  // Timestamps
  enrolledAt: number;
  lastAccessedAt: number;
  totalWatchTime: number; // In minutes
}

export interface LessonNote {
  id: string;
  content: string;
  timestamp: number; // Position in recording
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// LESSON DISCOVERY TYPES
// ============================================================================

export interface LessonFilters {
  categoryId?: string;
  level?: LessonLevel;
  status?: LessonStatus;
  visibility?: LessonVisibility;
  tags?: string[];
  creatorId?: string;
  organizationId?: string;
  minRating?: number;
  isFree?: boolean;
  sortBy?: 'createdAt' | 'publishedAt' | 'views' | 'rating' | 'duration' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LessonSearchResult {
  lesson: Lesson;
  relevanceScore: number;
  matchedFields: string[];
}

export interface FeaturedLessons {
  trending: Lesson[];
  new: Lesson[];
  recommended: Lesson[];
  topRated: Lesson[];
}

// ============================================================================
// LESSON CREATION TYPES
// ============================================================================

export interface LessonCreationData {
  title: string;
  description: string;
  level: LessonLevel;
  visibility: LessonVisibility;
  tags: string[];
  categoryId?: string;
  thumbnailUrl?: string;
}

export interface LessonUpdateData {
  title?: string;
  description?: string;
  level?: LessonLevel;
  visibility?: LessonVisibility;
  tags?: string[];
  categoryId?: string;
  thumbnailUrl?: string;
  status?: LessonStatus;
  blocks?: LessonBlock[];
  recordings?: LessonRecording[];
}

export interface AutoSaveData {
  lessonId: string;
  blocks: LessonBlock[];
  lastSavedAt: number;
  version: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface LessonAnalytics {
  lessonId: string;
  
  // Views
  totalViews: number;
  uniqueViewers: number;
  viewsOverTime: ViewDataPoint[];
  
  // Engagement
  averageWatchTime: number; // In minutes
  completionRate: number; // 0-100
  dropOffPoints: DropOffPoint[];
  
  // Ratings
  averageRating: number;
  ratingDistribution: { [rating: number]: number };
  
  // Student progress
  enrollments: number;
  completions: number;
  inProgress: number;
}

export interface ViewDataPoint {
  date: string;
  views: number;
}

export interface DropOffPoint {
  timestamp: number;
  percentage: number;
}

export default Lesson;
