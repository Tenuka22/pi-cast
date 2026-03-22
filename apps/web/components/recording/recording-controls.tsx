/**
 * Recording Controls Component
 *
 * UI controls for recording: start, stop, pause, resume, and bookmarks.
 */

'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  StopIcon,
  PauseIcon,
  PlayIcon,
  BookmarkIcon,
  RecordIcon,
  FlagIcon,
} from '@hugeicons/core-free-icons';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Card, CardContent } from '@workspace/ui/components/card';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onCreateBookmark: (title: string, description?: string) => void;
  className?: string;
}

export function RecordingControls({
  isRecording,
  isPaused,
  currentTime,
  onStart,
  onStop,
  onPause,
  onResume,
  onCreateBookmark,
  className,
}: RecordingControlsProps) {
  const [showBookmarkInput, setShowBookmarkInput] = React.useState(false);
  const [bookmarkTitle, setBookmarkTitle] = React.useState('');
  const [bookmarkDescription, setBookmarkDescription] = React.useState('');

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCreateBookmark = () => {
    if (bookmarkTitle.trim()) {
      onCreateBookmark(bookmarkTitle.trim(), bookmarkDescription.trim() || undefined);
      setBookmarkTitle('');
      setBookmarkDescription('');
      setShowBookmarkInput(false);
    }
  };

  const handleBookmarkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateBookmark();
    } else if (e.key === 'Escape') {
      setShowBookmarkInput(false);
      setBookmarkTitle('');
      setBookmarkDescription('');
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5">
          <div className="flex h-3 w-3 items-center justify-center">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          </div>
          <span className="text-sm font-medium text-red-600 dark:text-red-400">REC</span>
          <span className="ml-1 font-mono text-sm text-muted-foreground">{formatTime(currentTime)}</span>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-1">
        {!isRecording ? (
          // Start button
          <Button
            onClick={onStart}
            className="gap-2"
          >
            <HugeiconsIcon icon={RecordIcon} className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <>
            {/* Pause/Resume button */}
            <Button
              onClick={isPaused ? onResume : onPause}
              variant={isPaused ? 'default' : 'secondary'}
              className="gap-2"
            >
              <HugeiconsIcon icon={isPaused ? PlayIcon : PauseIcon} className="h-4 w-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>

            {/* Stop button */}
            <Button
              onClick={onStop}
              variant="destructive"
              className="gap-2"
            >
              <HugeiconsIcon icon={StopIcon} className="h-4 w-4" />
              Stop
            </Button>

            {/* Bookmark button */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowBookmarkInput(!showBookmarkInput)}
            >
              <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4" />
              Bookmark
            </Button>
          </>
        )}
      </div>

      {/* Bookmark Input */}
      {showBookmarkInput && (
        <Card className="shadow-lg">
          <CardContent className="flex items-center gap-2 p-2">
            <HugeiconsIcon icon={FlagIcon} className="h-4 w-4 text-muted-foreground" />
            <Input
              value={bookmarkTitle}
              onChange={(e) => setBookmarkTitle(e.target.value)}
              onKeyDown={handleBookmarkKeyDown}
              placeholder="Bookmark title..."
              className="h-8 w-48"
              autoFocus
            />
            <Input
              value={bookmarkDescription}
              onChange={(e) => setBookmarkDescription(e.target.value)}
              onKeyDown={handleBookmarkKeyDown}
              placeholder="Description (optional)"
              className="h-8 w-64"
            />
            <Button
              onClick={handleCreateBookmark}
              disabled={!bookmarkTitle.trim()}
              size="sm"
            >
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowBookmarkInput(false);
                setBookmarkTitle('');
                setBookmarkDescription('');
              }}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RecordingControls;
