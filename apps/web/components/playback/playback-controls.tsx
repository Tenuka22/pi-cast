/**
 * Playback Controls Component
 *
 * UI controls for lesson playback: play, pause, seek, speed, volume, bookmarks.
 */

'use client';

import * as React from 'react';
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

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Slider } from '@workspace/ui/components/slider';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Popover, PopoverContent } from '@workspace/ui/components/popover';

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
  onCycleSpeed,
  onSetVolume,
  onMute,
  onUnmute,
  onJumpToBookmark,
  onAddBookmark,
  className,
}: PlaybackControlsProps) {
  const [showBookmarkInput, setShowBookmarkInput] = React.useState(false);
  const [bookmarkTitle, setBookmarkTitle] = React.useState('');
  const [bookmarkDescription, setBookmarkDescription] = React.useState('');
  const [showBookmarks, setShowBookmarks] = React.useState(false);
  const [volumeOpen, setVolumeOpen] = React.useState(false);

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

  const handleProgressChange = (value: number | readonly number[]) => {
    const progress = Array.isArray(value) ? value[0] ?? 0 : value;
    if (typeof progress !== 'number') return;
    const newTime = (progress / 100) * state.duration;
    onSeek(newTime);
  };

  const handleVolumeChange = (value: number | readonly number[]) => {
    const volume = Array.isArray(value) ? value[0] ?? 0 : value;
    if (typeof volume !== 'number') return;
    onSetVolume(volume);
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const currentVolume = state.isMuted ? 0 : state.volume;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground w-12 text-right">
          {formatTime(state.currentTime)}
        </span>
        <Slider
          value={[progress]}
          onValueChange={handleProgressChange}
          min={0}
          max={100}
          step={0.1}
          className="flex-1"
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekRelative(-10000)}
            title="Rewind 10s"
          >
            <HugeiconsIcon icon={BackwardIcon} className="h-5 w-5" />
            <span className="ml-1 text-xs">10</span>
          </Button>

          {/* Play/Pause */}
          {state.status === 'playing' ? (
            <Button
              size="icon"
              onClick={onPause}
              title="Pause"
            >
              <HugeiconsIcon icon={PauseIcon} className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={onPlay}
              disabled={state.status === 'idle' || state.status === 'stopped'}
              title="Play"
            >
              <HugeiconsIcon icon={PlayIcon} className="h-5 w-5" />
            </Button>
          )}

          {/* Stop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            title="Stop"
          >
            <HugeiconsIcon icon={StopIcon} className="h-5 w-5" />
          </Button>

          {/* Forward 10s */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeekRelative(10000)}
            title="Forward 10s"
          >
            <span className="mr-1 text-xs">10</span>
            <HugeiconsIcon icon={ForwardIcon} className="h-5 w-5" />
          </Button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCycleSpeed}
            title="Change playback speed"
          >
            {state.speed}x
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Popover open={volumeOpen} onOpenChange={setVolumeOpen}>
            <Button
              variant="ghost"
              size="icon"
              render={
                <button
                  onClick={() => {
                    if (state.isMuted) {
                      onUnmute();
                    } else {
                      onMute();
                    }
                  }}
                  title={state.isMuted ? 'Unmute' : 'Mute'}
                >
                  <HugeiconsIcon icon={state.isMuted ? VolumeMuteIcon : VolumeHighIcon} className="h-5 w-5" />
                </button>
              }
            />
            <PopoverContent className="w-32" side="top" align="center">
              <div className="flex flex-col items-center gap-2">
                <Label>Volume</Label>
                <Slider
                  orientation="vertical"
                  value={[currentVolume * 100]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="h-32"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Bookmarks */}
        <div className="relative flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBookmarkInput(!showBookmarkInput)}
            title="Add bookmark"
          >
            <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4" />
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBookmarks(!showBookmarks)}
            title="View bookmarks"
          >
            <HugeiconsIcon icon={FlagIcon} className="h-4 w-4" />
            <span className="text-xs">{bookmarks.length}</span>
          </Button>
        </div>
      </div>

      {/* Bookmark Input */}
      {showBookmarkInput && (
        <Card className="shadow-lg">
          <CardContent className="flex items-center gap-2 p-2">
            <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4 text-muted-foreground" />
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
              onClick={handleAddBookmark}
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

      {/* Bookmarks List */}
      {showBookmarks && bookmarks.length > 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Bookmarks</span>
            </div>
            <div className="flex max-h-32 flex-col gap-1 overflow-auto">
              {bookmarks.map((bookmark) => (
                <Button
                  key={bookmark.id}
                  variant="ghost"
                  className="justify-between"
                  onClick={() => {
                    onJumpToBookmark(bookmark.id);
                    setShowBookmarks(false);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{bookmark.title}</span>
                    {bookmark.description && (
                      <span className="text-xs text-muted-foreground">{bookmark.description}</span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(bookmark.timestamp)}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PlaybackControls;
