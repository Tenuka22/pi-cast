/**
 * Recording Status Bar Component
 *
 * Displays recording status, timeline, and segment visualization.
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { AudioSegment, RecordingEvent } from '@/lib/recording-system/types';

interface RecordingStatusBarProps {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  events: RecordingEvent[];
  audioSegments: AudioSegment[];
  className?: string;
}

export function RecordingStatusBar({
  isRecording,
  currentTime,
  events,
  audioSegments,
  className,
}: RecordingStatusBarProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate total duration from segments
  const totalDuration =
    audioSegments.length > 0
      ? Math.max(...audioSegments.map((s) => s.endTime))
      : currentTime;

  // Get recent events
  const recentEvents = events.slice(-5).reverse();

  return (
    <div className={cn('flex flex-col gap-2 border-t border-border bg-card p-3', className)}>
      {/* Timeline */}
      <div className="relative h-12 w-full overflow-hidden rounded-md bg-muted">
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
            const width = totalDuration > 0 ? ((segment.duration / totalDuration) * 100) : 0;
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
                title={`Segment ${index + 1}: ${formatTime(segment.duration)} (${segment.isSilence ? 'Silence' : 'Speech'})`}
              />
            );
          })}
        </div>

        {/* Events markers */}
        <div className="absolute inset-0">
          {events.map((event) => {
            const left = totalDuration > 0 ? (event.timestamp / totalDuration) * 100 : 0;
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

        {/* Playhead */}
        {isRecording && (
          <div
            className="absolute top-0 h-full w-0.5 bg-red-500 transition-all"
            style={{ left: totalDuration > 0 ? `${(currentTime / totalDuration) * 100}%` : '0%' }}
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
            {totalDuration > 0 && (
              <span className="ml-1 text-xs">/ {formatTime(totalDuration)}</span>
            )}
          </div>

          {/* Segment count */}
          <div className="text-xs text-muted-foreground">
            {audioSegments.length} segment{audioSegments.length !== 1 ? 's' : ''}
          </div>

          {/* Event count */}
          <div className="text-xs text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Recent events */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Recent:</span>
          <div className="flex gap-1">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                title={event.type}
              >
                {event.type.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordingStatusBar;
