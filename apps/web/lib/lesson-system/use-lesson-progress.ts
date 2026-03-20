/**
 * useLessonProgress Hook
 * 
 * Manages lesson progress tracking including:
 * - Progress percentage
 * - Bookmark completion
 * - Watch time tracking
 * - Completion status
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface LessonProgress {
  lessonId: string;
  userId: string;
  progress: number; // 0-100 percentage
  currentBookmarkId?: string;
  completedBookmarks: string[];
  isCompleted: boolean;
  completedAt?: number;
  enrolledAt: number;
  lastAccessedAt: number;
  totalWatchTime: number; // In minutes
}

export interface BookmarkProgress {
  id: string;
  title: string;
  timestamp: number;
  isCompleted: boolean;
}

interface UseLessonProgressOptions {
  lessonId: string;
  userId: string;
  totalBookmarks?: number;
  onProgressUpdate?: (progress: number) => void;
  onCompletion?: () => void;
}

export function useLessonProgress({
  lessonId,
  userId,
  totalBookmarks = 0,
  onProgressUpdate,
  onCompletion,
}: UseLessonProgressOptions) {
  const [progress, setProgress] = useState<LessonProgress>(() => ({
    lessonId,
    userId,
    progress: 0,
    completedBookmarks: [],
    isCompleted: false,
    enrolledAt: Date.now(),
    lastAccessedAt: Date.now(),
    totalWatchTime: 0,
  }));

  const [currentBookmarkId, setCurrentBookmarkId] = useState<string | undefined>();
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdateRef = useRef<number>(0);

  // Initialize lastProgressUpdateRef on mount
  useEffect(() => {
    lastProgressUpdateRef.current = Date.now();
  }, []);

  // Calculate progress based on completed bookmarks
  const calculateProgress = useCallback(
    (completedBookmarks: string[], totalBookmarks: number): number => {
      if (totalBookmarks === 0) return 0;
      return Math.round((completedBookmarks.length / totalBookmarks) * 100);
    },
    []
  );

  // Mark a bookmark as completed
  const completeBookmark = useCallback(
    (bookmarkId: string) => {
      setProgress((prev) => {
        const isAlreadyCompleted = prev.completedBookmarks.includes(bookmarkId);
        if (isAlreadyCompleted) {
          return prev;
        }

        const newCompletedBookmarks = [...prev.completedBookmarks, bookmarkId];
        const newProgress = calculateProgress(newCompletedBookmarks, totalBookmarks);
        const isCompleted = newProgress >= 100;

        // Callback for progress update
        onProgressUpdate?.(newProgress);

        // Callback for completion
        if (isCompleted && !prev.isCompleted) {
          onCompletion?.();
        }

        return {
          ...prev,
          completedBookmarks: newCompletedBookmarks,
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? Date.now() : prev.completedAt,
          lastAccessedAt: Date.now(),
        };
      });
    },
    [totalBookmarks, onProgressUpdate, onCompletion, calculateProgress]
  );

  // Update current bookmark
  const updateCurrentBookmark = useCallback((bookmarkId: string | undefined) => {
    setCurrentBookmarkId(bookmarkId);
    setProgress((prev) => ({
      ...prev,
      currentBookmarkId: bookmarkId,
      lastAccessedAt: Date.now(),
    }));
  }, []);

  // Reset progress
  const resetProgress = useCallback(() => {
    setProgress({
      lessonId,
      userId,
      progress: 0,
      completedBookmarks: [],
      isCompleted: false,
      enrolledAt: Date.now(),
      lastAccessedAt: Date.now(),
      totalWatchTime: 0,
    });
    setCurrentBookmarkId(undefined);
  }, [lessonId, userId]);

  // Update watch time (called periodically during playback)
  const updateWatchTime = useCallback((watchTimeMinutes: number) => {
    setProgress((prev) => ({
      ...prev,
      totalWatchTime: prev.totalWatchTime + watchTimeMinutes,
      lastAccessedAt: Date.now(),
    }));
  }, []);

  // Start tracking watch time
  const startTracking = useCallback(() => {
    if (watchTimeIntervalRef.current) return;

    watchTimeIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedMinutes = (now - lastProgressUpdateRef.current) / 1000 / 60;
      if (elapsedMinutes >= 0.1) { // Update every 6 seconds
        updateWatchTime(elapsedMinutes);
        lastProgressUpdateRef.current = now;
      }
    }, 6000);

    lastProgressUpdateRef.current = Date.now();
  }, [updateWatchTime]);

  // Stop tracking watch time
  const stopTracking = useCallback(() => {
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }
  }, []);

  // Get bookmark progress
  const getBookmarkProgress = useCallback(
    (bookmarks: Array<{ id: string; title: string; timestamp: number }>): BookmarkProgress[] => {
      return bookmarks.map((bookmark) => ({
        ...bookmark,
        isCompleted: progress.completedBookmarks.includes(bookmark.id),
      }));
    },
    [progress.completedBookmarks]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // State
    progress,
    currentBookmarkId,

    // Actions
    completeBookmark,
    updateCurrentBookmark,
    resetProgress,
    startTracking,
    stopTracking,
    updateWatchTime,

    // Getters
    getBookmarkProgress,
    isCompleted: progress.isCompleted,
    progressPercentage: progress.progress,
    completedBookmarksCount: progress.completedBookmarks.length,
    totalBookmarksCount: totalBookmarks,
  };
}

export default useLessonProgress;
