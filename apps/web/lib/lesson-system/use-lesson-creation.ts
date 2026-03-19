/**
 * Lesson Creation Hook
 * 
 * Manages lesson creation, editing, and auto-save functionality.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Lesson,
  LessonCreationData,
  LessonUpdateData,
  LessonBlock,
  LessonRecording,
  AutoSaveData,
} from './types';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const AUTO_SAVE_DEBOUNCE = 5000; // 5 seconds after last change

interface UseLessonCreationOptions {
  lessonId?: string;
  onAutoSave?: (data: AutoSaveData) => void;
  onError?: (error: Error) => void;
}

export function useLessonCreation(options: UseLessonCreationOptions = {}) {
  const { onAutoSave, onError } = options;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const lastChangeRef = useRef<number>(Date.now());
  const autoSaveTimerRef = useRef<number | null>(null);

  // Create new lesson
  const createLesson = useCallback((data: LessonCreationData) => {
    const now = Date.now();
    const newLesson: Lesson = {
      id: `lesson-${now}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      status: 'draft',
      blocks: [],
      recordings: [],
      bookmarks: [],
      views: 0,
      completions: 0,
      averageRating: 0,
      totalRatings: 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
      creatorId: 'current-user',
      creatorName: 'Current User',
    };

    setLesson(newLesson);
    setIsDirty(true);
    setLastSavedAt(now);
    setError(null);

    return newLesson;
  }, []);

  // Update lesson metadata
  const updateLesson = useCallback((updates: LessonUpdateData) => {
    if (!lesson) return;

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
            updatedAt: Date.now(),
            version: prev.version + 1,
          }
        : null
    );
    setIsDirty(true);
    lastChangeRef.current = Date.now();
  }, [lesson]);

  // Add block to lesson
  const addBlock = useCallback((block: LessonBlock) => {
    if (!lesson) return;

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            blocks: [...prev.blocks, block],
            updatedAt: Date.now(),
          }
        : null
    );
    setIsDirty(true);
    lastChangeRef.current = Date.now();
  }, [lesson]);

  // Update block
  const updateBlock = useCallback((blockId: string, updates: Partial<LessonBlock>) => {
    if (!lesson) return;

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            blocks: prev.blocks.map((block) =>
              block.id === blockId ? { ...block, ...updates } : block
            ),
            updatedAt: Date.now(),
          }
        : null
    );
    setIsDirty(true);
    lastChangeRef.current = Date.now();
  }, [lesson]);

  // Remove block
  const removeBlock = useCallback((blockId: string) => {
    if (!lesson) return;

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            blocks: prev.blocks.filter((block) => block.id !== blockId),
            updatedAt: Date.now(),
          }
        : null
    );
    setIsDirty(true);
    lastChangeRef.current = Date.now();
  }, [lesson]);

  // Add recording
  const addRecording = useCallback((recording: LessonRecording) => {
    if (!lesson) return;

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            recordings: [...(prev.recordings || []), recording],
            updatedAt: Date.now(),
          }
        : null
    );
    setIsDirty(true);
    lastChangeRef.current = Date.now();
  }, [lesson]);

  // Add bookmark
  const addBookmark = useCallback((bookmark: { title: string; description?: string; timestamp: number; type?: 'teacher' | 'student' }) => {
    if (!lesson) return null;

    const newBookmark = {
      ...bookmark,
      id: `bookmark-${Date.now()}`,
      type: bookmark.type || 'teacher',
    };

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            bookmarks: [...prev.bookmarks, newBookmark],
            updatedAt: Date.now(),
          }
        : null
    );

    return newBookmark;
  }, [lesson]);

  // Save lesson (manual or auto)
  const saveLesson = useCallback(async () => {
    if (!lesson || !isDirty) return;

    setIsSaving(true);
    setError(null);

    try {
      // Simulate API call - in production, this would save to database
      await new Promise((resolve) => setTimeout(resolve, 500));

      const saveData: AutoSaveData = {
        lessonId: lesson.id,
        blocks: lesson.blocks,
        lastSavedAt: Date.now(),
        version: lesson.version,
      };

      setLastSavedAt(Date.now());
      setIsDirty(false);
      onAutoSave?.(saveData);

      console.log('Lesson saved:', saveData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save lesson');
      setError(error);
      onError?.(error);
    } finally {
      setIsSaving(false);
    }
  }, [lesson, isDirty, onAutoSave, onError]);

  // Publish lesson
  const publishLesson = useCallback(async () => {
    if (!lesson) return;

    // Validate lesson before publishing
    if (lesson.blocks.length === 0) {
      const error = new Error('Lesson must have at least one block');
      setError(error);
      return;
    }

    await saveLesson();

    setLesson((prev) =>
      prev
        ? {
            ...prev,
            status: 'published',
            publishedAt: Date.now(),
            updatedAt: Date.now(),
          }
        : null
    );
  }, [lesson, saveLesson]);

  // Delete lesson
  const deleteLesson = useCallback(async () => {
    if (!lesson) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLesson((prev) =>
        prev
          ? {
              ...prev,
              status: 'deleted',
              updatedAt: Date.now(),
            }
          : null
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete lesson');
      setError(error);
    }
  }, [lesson]);

  // Load lesson from storage
  const loadLesson = useCallback((loadedLesson: Lesson) => {
    setLesson(loadedLesson);
    setIsDirty(false);
    setLastSavedAt(loadedLesson.updatedAt);
    setError(null);
  }, []);

  // Reset lesson
  const resetLesson = useCallback(() => {
    setLesson(null);
    setIsDirty(false);
    setIsSaving(false);
    setLastSavedAt(null);
    setError(null);
    lastChangeRef.current = Date.now();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (isDirty && lesson) {
      autoSaveTimerRef.current = window.setTimeout(() => {
        void saveLesson();
      }, AUTO_SAVE_DEBOUNCE);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, lesson, saveLesson]);

  // Periodic auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty && lesson && !isSaving) {
        void saveLesson();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [isDirty, lesson, isSaving, saveLesson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    lesson,
    isDirty,
    isSaving,
    lastSavedAt,
    error,

    // Actions
    createLesson,
    updateLesson,
    addBlock,
    updateBlock,
    removeBlock,
    addRecording,
    addBookmark,
    saveLesson,
    publishLesson,
    deleteLesson,
    loadLesson,
    resetLesson,
  };
}

export default useLessonCreation;
