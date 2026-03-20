/**
 * Course Creator Component
 * 
 * Interface for creating and managing courses/playlists.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { Course, CourseLesson } from '@/lib/lesson-system/types';

function isValidLessonLevel(value: string): value is 'beginner' | 'intermediate' | 'advanced' {
  return ['beginner', 'intermediate', 'advanced'].includes(value);
}

interface CourseCreatorProps {
  courseId?: string;
  onSave?: (course: Course) => void;
  className?: string;
}

export function CourseCreator({ courseId, onSave, className }: CourseCreatorProps) {
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    level: 'beginner',
    isPublished: false,
    isFree: true,
    lessons: [],
    tags: [],
  });

  const [isDirty, setIsDirty] = useState(false);

  const updateCourse = useCallback((updates: Partial<Course>) => {
    setCourse((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const addLesson = useCallback((lessonId: string, title: string) => {
    setCourse((prev) => {
      const newLesson: CourseLesson = {
        lessonId,
        title,
        order: prev.lessons?.length || 0,
        isLocked: false,
      };
      return {
        ...prev,
        lessons: [...(prev.lessons || []), newLesson],
      };
    });
    setIsDirty(true);
  }, []);

  const removeLesson = useCallback((lessonId: string) => {
    setCourse((prev) => ({
      ...prev,
      lessons: (prev.lessons || []).filter((l) => l.lessonId !== lessonId),
    }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!course.title) return;

    const now = Date.now();
    const newCourse: Course = {
      id: courseId || `course-${now}`,
      title: course.title,
      description: course.description || '',
      level: course.level || 'beginner',
      tags: course.tags || [],
      lessons: course.lessons || [],
      totalDuration: 0,
      creatorId: 'current-user',
      creatorName: 'Current User',
      enrolledStudents: 0,
      averageRating: 0,
      totalRatings: 0,
      isPublished: course.isPublished || false,
      isFree: course.isFree !== false,
      createdAt: now,
      updatedAt: now,
      publishedAt: course.isPublished ? now : undefined,
    };

    onSave?.(newCourse);
    setIsDirty(false);
  }, [course, courseId, onSave]);

  return (
    <div className={cn('flex h-screen w-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card p-3">
        <h1 className="text-lg font-semibold">{courseId ? 'Edit Course' : 'Create Course'}</h1>
        <button
          onClick={handleSave}
          disabled={!course.title || !isDirty}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Course
        </button>
      </div>

      {/* Course Details */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Course Title *</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => updateCourse({ title: e.target.value })}
                placeholder="Enter course title"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={course.description}
                onChange={(e) => updateCourse({ description: e.target.value })}
                placeholder="Describe what students will learn in this course"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Level</label>
                <select
                  value={course.level || 'beginner'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidLessonLevel(value)) {
                      updateCourse({ level: value });
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Pricing</label>
                <select
                  value={course.isFree ? 'free' : 'paid'}
                  onChange={(e) => updateCourse({ isFree: e.target.value === 'free' })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tags</label>
              <input
                type="text"
                value={course.tags?.join(', ')}
                onChange={(e) =>
                  updateCourse({
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="mathematics, algebra, calculus"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Lessons */}
          <div className="rounded-lg border border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Course Lessons</h2>
              <button
                onClick={() => addLesson('new-lesson', 'New Lesson')}
                className="text-sm text-primary hover:underline"
              >
                + Add Lesson
              </button>
            </div>

            {course.lessons && course.lessons.length > 0 ? (
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson.lessonId}
                    className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm">{lesson.title}</span>
                    </div>
                    <button
                      onClick={() => removeLesson(lesson.lessonId)}
                      className="text-sm text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No lessons yet. Add lessons to build your course.
              </div>
            )}
          </div>

          {/* Publishing */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Publish Course</h2>
                <p className="text-xs text-muted-foreground">
                  Make your course visible to students
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={course.isPublished}
                  onChange={(e) => updateCourse({ isPublished: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-background after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCreator;
