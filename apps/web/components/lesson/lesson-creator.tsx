/**
 * Lesson Creator Component
 * 
 * Main interface for creating and editing lessons.
 * Includes block canvas, recording controls, and metadata editing.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { useLessonCreation } from '@/lib/lesson-system/use-lesson-creation';
import { GridCanvas } from '@/components/blocks/grid-canvas';
import type { LessonCreationData } from '@/lib/lesson-system/types';

function isValidLessonLevel(value: string): value is 'beginner' | 'intermediate' | 'advanced' | 'all' {
  return ['beginner', 'intermediate', 'advanced', 'all'].includes(value);
}

function isValidLessonVisibility(value: string): value is 'private' | 'unlisted' | 'organization' | 'public' {
  return ['private', 'unlisted', 'organization', 'public'].includes(value);
}

interface LessonCreatorProps {
  lessonId?: string;
  onSave?: (lessonId: string) => void;
  className?: string;
}

export function LessonCreator({ lessonId, onSave, className }: LessonCreatorProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadata, setMetadata] = useState<Partial<LessonCreationData>>({
    title: '',
    description: '',
    level: 'beginner',
    visibility: 'private',
    tags: [],
  });

  const {
    lesson,
    isDirty,
    isSaving,
    lastSavedAt,
    createLesson,
    saveLesson,
    publishLesson,
  } = useLessonCreation({
    lessonId,
    onAutoSave: (data) => {
      console.log('Auto-saved:', data);
    },
  });

  const handleCreateLesson = useCallback(() => {
    if (!metadata.title) return;

    const newLesson = createLesson({
      title: metadata.title,
      description: metadata.description || '',
      level: metadata.level || 'beginner',
      visibility: metadata.visibility || 'private',
      tags: metadata.tags || [],
    });

    if (newLesson && onSave) {
      onSave(newLesson.id);
    }
  }, [metadata, createLesson, onSave]);

  const handlePublish = useCallback(async () => {
    await publishLesson();
  }, [publishLesson]);

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Not saved';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={cn('flex h-screen w-full flex-col', className)}>
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card p-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            {lesson ? (
              <>
                <h1 className="text-lg font-semibold">{lesson.title}</h1>
                <span className="text-xs text-muted-foreground">
                  {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                </span>
              </>
            ) : (
              <h1 className="text-lg font-semibold">New Lesson</h1>
            )}
          </div>

          {/* Save Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                Saving...
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Saved at {formatTime(lastSavedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!lesson ? (
            <button
              onClick={handleCreateLesson}
              disabled={!metadata.title}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Lesson
            </button>
          ) : (
            <>
              <button
                onClick={() => { void saveLesson(); }}
                disabled={!isDirty || isSaving}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => { void handlePublish(); }}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Publish
              </button>
            </>
          )}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {showMetadata ? 'Hide' : 'Edit'} Details
          </button>
        </div>
      </div>

      {/* Metadata Editor */}
      {showMetadata && (
        <div className="border-b border-border bg-card p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter lesson title"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Level</label>
                <select
                  value={metadata.level || 'beginner'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidLessonLevel(value)) {
                      setMetadata((prev) => ({ ...prev, level: value }));
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all">All Levels</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Visibility</label>
                <select
                  value={metadata.visibility || 'private'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidLessonVisibility(value)) {
                      setMetadata((prev) => ({ ...prev, visibility: value }));
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="organization">Organization</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tags</label>
              <input
                type="text"
                value={metadata.tags?.join(', ')}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  }))
                }
                placeholder="algebra, linear equations, graphing"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden">
        {lesson ? (
          <GridCanvas />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-medium">Create a lesson to get started</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter lesson details above and click &ldquo;Create Lesson&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonCreator;
