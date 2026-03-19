/**
 * Recording Controls Component
 *
 * UI controls for recording: start, stop, pause, resume, and bookmarks.
 */

'use client';

import React, { useState } from 'react';
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
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');

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
          <button
            onClick={onStart}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Start recording"
          >
            <HugeiconsIcon icon={RecordIcon} className="h-4 w-4" />
            Start Recording
          </button>
        ) : (
          <>
            {/* Pause/Resume button */}
            <button
              onClick={isPaused ? onResume : onPause}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                isPaused
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              )}
              title={isPaused ? 'Resume recording' : 'Pause recording'}
            >
              <HugeiconsIcon icon={isPaused ? PlayIcon : PauseIcon} className="h-4 w-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            {/* Stop button */}
            <button
              onClick={onStop}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              title="Stop recording"
            >
              <HugeiconsIcon icon={StopIcon} className="h-4 w-4" />
              Stop
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => setShowBookmarkInput(!showBookmarkInput)}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              title="Add bookmark"
            >
              <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4" />
              Bookmark
            </button>
          </>
        )}
      </div>

      {/* Bookmark Input */}
      {showBookmarkInput && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2 shadow-lg">
          <HugeiconsIcon icon={FlagIcon} className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={bookmarkTitle}
            onChange={(e) => setBookmarkTitle(e.target.value)}
            onKeyDown={handleBookmarkKeyDown}
            placeholder="Bookmark title..."
            className="h-8 w-48 rounded-md border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <input
            type="text"
            value={bookmarkDescription}
            onChange={(e) => setBookmarkDescription(e.target.value)}
            onKeyDown={handleBookmarkKeyDown}
            placeholder="Description (optional)"
            className="h-8 w-64 rounded-md border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleCreateBookmark}
            disabled={!bookmarkTitle.trim()}
            className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowBookmarkInput(false);
              setBookmarkTitle('');
              setBookmarkDescription('');
            }}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default RecordingControls;
