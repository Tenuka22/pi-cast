/**
 * Course Creator Component
 *
 * Interface for creating and managing courses/playlists.
 */

'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { cn } from '@workspace/ui/lib/utils';
import type { Course, CourseLesson } from '@/lib/lesson-system/types';

import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Switch } from '@workspace/ui/components/switch';

interface CourseCreatorProps {
  courseId?: string;
  onSave?: (course: Course) => void;
  className?: string;
}

interface CourseFormValues {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isFree: boolean;
  tags: string[];
}

export function CourseCreator({ courseId, onSave, className }: CourseCreatorProps) {
  const [isDirty, setIsDirty] = React.useState(false);
  const [lessons, setLessons] = React.useState<CourseLesson[]>([]);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      level: 'beginner' as const,
      isFree: true as boolean,
      tags: [] as string[],
    } satisfies CourseFormValues,
    onSubmit: async ({ value }) => {
      if (!value.title) return;

      const now = Date.now();
      const newCourse: Course = {
        id: courseId || `course-${now}`,
        title: value.title,
        description: value.description || '',
        level: value.level,
        tags: value.tags || [],
        lessons,
        totalDuration: 0,
        creatorId: 'current-user',
        creatorName: 'Current User',
        enrolledStudents: 0,
        averageRating: 0,
        totalRatings: 0,
        isPublished: value.isFree !== undefined,
        isFree: value.isFree !== false,
        createdAt: now,
        updatedAt: now,
        publishedAt: value.isFree ? now : undefined,
      };

      onSave?.(newCourse);
      setIsDirty(false);
    },
  });

  const addLesson = React.useCallback((lessonId: string, title: string) => {
    setLessons((prev) => {
      const newLesson: CourseLesson = {
        lessonId,
        title,
        order: prev.length,
        isLocked: false,
      };
      return [...prev, newLesson];
    });
    setIsDirty(true);
  }, []);

  const removeLesson = React.useCallback((lessonId: string) => {
    setLessons((prev) => prev.filter((l) => l.lessonId !== lessonId));
    setIsDirty(true);
  }, []);

  return (
    <div className={cn('flex h-screen w-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card p-3">
        <h1 className="text-lg font-semibold">
          {courseId ? 'Edit Course' : 'Create Course'}
        </h1>
        <Button
          type="button"
          onClick={async () => {
            await form.handleSubmit()
          }}
          disabled={!form.getFieldValue('title') || !isDirty}
        >
          Save Course
        </Button>
      </div>

      {/* Course Details */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <form
                id="course-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await form.handleSubmit();
                }}
              >
                <FieldGroup>
                  <form.Field
                    name="title"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Course Title *</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              setIsDirty(true);
                            }}
                            placeholder="Enter course title"
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />

                  <form.Field
                    name="description"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                          <Textarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              setIsDirty(true);
                            }}
                            placeholder="Describe what students will learn in this course"
                            rows={4}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <form.Field
                      name="level"
                      children={(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Level</FieldLabel>
                          <NativeSelect
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value as typeof field.state.value);
                              setIsDirty(true);
                            }}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </NativeSelect>
                        </Field>
                      )}
                    />

                    <form.Field
                      name="isFree"
                      children={(field) => (
                        <Field orientation="horizontal">
                          <FieldLabel htmlFor={field.name}>Pricing</FieldLabel>
                          <div className="flex items-center gap-2">
                            <NativeSelect
                              id={field.name}
                              name={field.name}
                              value={field.state.value ? 'free' : 'paid'}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                field.handleChange(e.target.value === 'free');
                                setIsDirty(true);
                              }}
                            >
                              <option value="free">Free</option>
                              <option value="paid">Paid</option>
                            </NativeSelect>
                            <Switch
                              checked={field.state.value}
                              onCheckedChange={(checked) => {
                                field.handleChange(checked);
                                setIsDirty(true);
                              }}
                            />
                          </div>
                        </Field>
                      )}
                    />
                  </div>

                  <form.Field
                    name="tags"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value.join(', ')}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(
                                e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                              );
                              setIsDirty(true);
                            }}
                            placeholder="mathematics, algebra, calculus"
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Course Lessons</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson('new-lesson', 'New Lesson')}
                >
                  + Add Lesson
                </Button>
              </div>

              {lessons.length > 0 ? (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLesson(lesson.lessonId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No lessons yet. Add lessons to build your course.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Publish Course</h2>
                  <p className="text-xs text-muted-foreground">
                    Make your course visible to students
                  </p>
                </div>
                <form.Field
                  name="isFree"
                  children={(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        setIsDirty(true);
                      }}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CourseCreator;
