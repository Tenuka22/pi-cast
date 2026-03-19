/**
 * Playback Status Bar Component
 *
 * Displays playback progress, event markers, and bookmark indicators.
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { RecordingEvent, Bookmark, AudioSegment } from '@/lib/recording-system/types';

interface PlaybackStatusBarProps {
  currentTime: number;
  duration: number;
  events: RecordingEvent[];
  bookmarks: Bookmark[];
  audioSegments: AudioSegment[];
  isPlaying: boolean;
  className?: string;
}

export function PlaybackStatusBar({
  currentTime,
  duration,
  events,
  bookmarks,
  audioSegments,
  isPlaying,
  className,
}: PlaybackStatusBarProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get event markers for timeline
  const eventMarkers = events.filter(
    (event) => event.type !== 'BOOKMARK_CREATED'
  );

  return (
    <div className={cn('flex flex-col gap-2 border-t border-border bg-card p-3', className)}>
      {/* Timeline with markers */}
      <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
        {/* Time markers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-full w-1/10 flex-col justify-between py-1">
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
            </div>
          ))}
        </div>

        {/* Audio segments visualization */}
        <div className="absolute inset-0 flex items-center gap-0.5 px-2">
          {audioSegments.map((segment, index) => {
            const width = duration > 0 ? ((segment.duration / duration) * 100) : 0;
            return (
              <div
                key={segment.id}
                className={cn(
                  'h-8 min-w-[2px] rounded-sm transition-all',
                  segment.isSilence
                    ? 'bg-muted-foreground/20'
                    : 'bg-primary/60 hover:bg-primary/80'
                )}
                style={{ width: `${Math.max(width, 0.5)}%` }}
                title={`Segment ${index + 1}: ${formatTime(segment.duration)}`}
              />
            );
          })}
        </div>

        {/* Event markers */}
        <div className="absolute inset-0">
          {eventMarkers.map((event) => {
            const left = duration > 0 ? (event.timestamp / duration) * 100 : 0;
            return (
              <div
                key={event.id}
                className="absolute top-0 h-3 w-0.5 bg-yellow-500"
                style={{ left: `${left}%` }}
                title={`${event.type} at ${formatTime(event.timestamp)}`}
              />
            );
          })}
        </div>

        {/* Bookmark markers */}
        <div className="absolute inset-0">
          {bookmarks.map((bookmark) => {
            const left = duration > 0 ? (bookmark.timestamp / duration) * 100 : 0;
            return (
              <div
                key={bookmark.id}
                className="absolute bottom-0 h-4 w-1 bg-purple-500 rounded-t-sm"
                style={{ left: `${left}%` }}
                title={`Bookmark: ${bookmark.title} at ${formatTime(bookmark.timestamp)}`}
              />
            );
          })}
        </div>

        {/* Playhead */}
        {isPlaying && (
          <div
            className="absolute top-0 h-full w-0.5 bg-red-500 transition-all"
            style={{ left: `${progress}%` }}
          >
            <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-red-500" />
          </div>
        )}
      </div>

      {/* Status info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Current time */}
          <div className="font-mono text-sm text-muted-foreground">
            {formatTime(currentTime)}
            {duration > 0 && (
              <span className="ml-1 text-xs">/ {formatTime(duration)}</span>
            )}
          </div>

          {/* Event count */}
          <div className="text-xs text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </div>

          {/* Bookmark count */}
          <div className="text-xs text-muted-foreground">
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-yellow-500" />
            <span className="text-muted-foreground">Events</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-purple-500" />
            <span className="text-muted-foreground">Bookmarks</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaybackStatusBar;
