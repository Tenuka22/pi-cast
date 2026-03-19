/**
 * Playback Controls Component
 *
 * UI controls for lesson playback: play, pause, seek, speed, volume, bookmarks.
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  BookmarkIcon,
  ForwardIcon,
  BackwardIcon,
  FlagIcon,
} from '@hugeicons/core-free-icons';
import type { PlaybackState, PlaybackSpeed, Bookmark } from '@/lib/recording-system/types';

interface PlaybackControlsProps {
  state: PlaybackState;
  bookmarks: Bookmark[];
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSeekRelative: (delta: number) => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onCycleSpeed: () => void;
  onSetVolume: (volume: number) => void;
  onMute: () => void;
  onUnmute: () => void;
  onJumpToBookmark: (bookmarkId: string) => void;
  onAddBookmark: (title: string, description?: string) => void;
  className?: string;
}

export function PlaybackControls({
  state,
  bookmarks,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSeekRelative,
  onSetSpeed,
  onCycleSpeed,
  onSetVolume,
  onMute,
  onUnmute,
  onJumpToBookmark,
  onAddBookmark,
  className,
}: PlaybackControlsProps) {
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

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

  const handleAddBookmark = () => {
    if (bookmarkTitle.trim()) {
      onAddBookmark(bookmarkTitle.trim(), bookmarkDescription.trim() || undefined);
      setBookmarkTitle('');
      setBookmarkDescription('');
      setShowBookmarkInput(false);
    }
  };

  const handleBookmarkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddBookmark();
    } else if (e.key === 'Escape') {
      setShowBookmarkInput(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value);
    const newTime = (progress / 100) * state.duration;
    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    onSetVolume(volume);
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground w-12 text-right">
          {formatTime(state.currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="flex-1 h-2 cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
          style={{
            background: `linear-gradient(to right, oklch(0.518 0.253 323.949) 0%, oklch(0.518 0.253 323.949) ${progress}%, oklch(0.542 0.034 322.5) ${progress}%, oklch(0.542 0.034 322.5) 100%)`,
          }}
        />
        <span className="font-mono text-xs text-muted-foreground w-12">
          {formatTime(state.duration)}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Main Playback Controls */}
        <div className="flex items-center gap-1">
          {/* Rewind 10s */}
          <button
            onClick={() => onSeekRelative(-10000)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent transition-colors"
            title="Rewind 10s"
          >
            <HugeiconsIcon icon={BackwardIcon} className="h-5 w-5" />
            <span className="ml-1 text-xs">10</span>
          </button>

          {/* Play/Pause */}
          {state.status === 'playing' ? (
            <button
              onClick={onPause}
              className="flex items-center justify-center rounded-md bg-primary p-3 text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Pause"
            >
              <HugeiconsIcon icon={PauseIcon} className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center justify-center rounded-md bg-primary p-3 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Play"
              disabled={state.status === 'idle' || state.status === 'stopped'}
            >
              <HugeiconsIcon icon={PlayIcon} className="h-5 w-5" />
            </button>
          )}

          {/* Stop */}
          <button
            onClick={onStop}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent transition-colors"
            title="Stop"
          >
            <HugeiconsIcon icon={StopIcon} className="h-5 w-5" />
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => onSeekRelative(10000)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent transition-colors"
            title="Forward 10s"
          >
            <span className="mr-1 text-xs">10</span>
            <HugeiconsIcon icon={ForwardIcon} className="h-5 w-5" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCycleSpeed}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            title="Change playback speed"
          >
            {state.speed}x
          </button>
        </div>

        {/* Volume Control */}
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setShowVolumeSlider(!showVolumeSlider);
                if (state.isMuted) {
                  onUnmute();
                } else {
                  onMute();
                }
              }}
              className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent transition-colors"
              title={state.isMuted ? 'Unmute' : 'Mute'}
            >
              <HugeiconsIcon icon={state.isMuted ? VolumeMuteIcon : VolumeHighIcon} className="h-5 w-5" />
            </button>
            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border border-border bg-card p-2 shadow-lg">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.isMuted ? 0 : state.volume}
                  onChange={handleVolumeChange}
                  className="h-24 w-2 cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                  style={{
                    background: `linear-gradient(to top, oklch(0.518 0.253 323.949) 0%, oklch(0.518 0.253 323.949) ${state.isMuted ? 0 : state.volume * 100}%, oklch(0.542 0.034 322.5) ${state.isMuted ? 0 : state.volume * 100}%, oklch(0.542 0.034 322.5) 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bookmarks */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowBookmarkInput(!showBookmarkInput)}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            title="Add bookmark"
          >
            <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4" />
            Add
          </button>
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            title="View bookmarks"
          >
            <HugeiconsIcon icon={FlagIcon} className="h-4 w-4" />
            <span className="text-xs">{bookmarks.length}</span>
          </button>
        </div>
      </div>

      {/* Bookmark Input */}
      {showBookmarkInput && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2 shadow-lg">
          <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4 text-muted-foreground" />
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
            onClick={handleAddBookmark}
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

      {/* Bookmarks List */}
      {showBookmarks && bookmarks.length > 0 && (
        <div className="rounded-md border border-border bg-card p-2 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Bookmarks</span>
          </div>
          <div className="flex max-h-32 flex-col gap-1 overflow-auto">
            {bookmarks.map((bookmark) => (
              <button
                key={bookmark.id}
                onClick={() => {
                  onJumpToBookmark(bookmark.id);
                  setShowBookmarks(false);
                }}
                className="flex items-center justify-between rounded-md border border-border bg-background p-2 text-left hover:bg-accent transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{bookmark.title}</span>
                  {bookmark.description && (
                    <span className="text-xs text-muted-foreground">{bookmark.description}</span>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTime(bookmark.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaybackControls;
