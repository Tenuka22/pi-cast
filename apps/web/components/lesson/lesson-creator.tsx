/**
 * Lesson Creator Component
 *
 * Main interface for creating and editing lessons.
 * Includes block canvas, recording controls, and metadata editing.
 */

'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { cn } from '@workspace/ui/lib/utils';
import { useLessonCreation } from '@/lib/lesson-system/use-lesson-creation';
import { GridCanvas } from '@/components/blocks/grid-canvas';

import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { NativeSelect } from '@workspace/ui/components/native-select';

interface LessonCreatorProps {
  lessonId?: string;
  onSave?: (lessonId: string) => void;
  className?: string;
}

interface LessonFormValues {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  visibility: 'private' | 'unlisted' | 'organization' | 'public';
  tags: string[];
}

export function LessonCreator({ lessonId, onSave, className }: LessonCreatorProps) {
  const [showMetadata, setShowMetadata] = React.useState(false);

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

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      level: 'beginner' as const,
      visibility: 'private' as const,
      tags: [] as string[],
    } satisfies LessonFormValues,
    onSubmit: async ({ value }) => {
      const newLesson = createLesson({
        title: value.title,
        description: value.description || '',
        level: value.level,
        visibility: value.visibility,
        tags: value.tags || [],
      });

      if (newLesson && onSave) {
        onSave(newLesson.id);
      }
    },
  });

  const handlePublish = React.useCallback(async () => {
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
            <Button
              type="button"
              onClick={async () => {
                await form.handleSubmit()
              }}
              disabled={!form.getFieldValue('title')}
            >
              Create Lesson
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await saveLesson()
                }}
                disabled={!isDirty || isSaving}
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await handlePublish()
                }}
              >
                Publish
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMetadata(!showMetadata)}
          >
            {showMetadata ? 'Hide' : 'Edit'} Details
          </Button>
        </div>
      </div>

      {/* Metadata Editor */}
      {showMetadata && (
        <Card className="mx-auto my-4 max-w-3xl border-b border-border">
          <CardContent className="space-y-4 p-4">
            <form
              id="lesson-metadata-form"
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
                        <FieldLabel htmlFor={field.name}>Title *</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter lesson title"
                          autoComplete="off"
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
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Describe what students will learn"
                          rows={3}
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
                          }}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="all">All Levels</option>
                        </NativeSelect>
                      </Field>
                    )}
                  />

                  <form.Field
                    name="visibility"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Visibility</FieldLabel>
                        <NativeSelect
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value as typeof field.state.value);
                          }}
                        >
                          <option value="private">Private</option>
                          <option value="unlisted">Unlisted</option>
                          <option value="organization">Organization</option>
                          <option value="public">Public</option>
                        </NativeSelect>
                      </Field>
                    )}
                  />
                </div>

                <form.Field
                  name="tags"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value.join(', ')}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value.split(',').map((t) => t.trim()).filter(Boolean) as typeof field.state.value
                          )
                        }
                        placeholder="algebra, linear equations, graphing"
                      />
                      <FieldDescription>
                        Separate tags with commas
                      </FieldDescription>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
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
