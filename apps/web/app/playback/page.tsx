'use client';

import React, { useState } from 'react';
import { GridCanvas } from '@/components/blocks/grid-canvas';
import { BlockLibrary } from '@/components/blocks/block-library';
import { PlaybackControls } from '@/components/playback/playback-controls';
import { PlaybackStatusBar } from '@/components/playback/playback-status-bar';
import { usePlayback } from '@/lib/recording-system/use-playback';
import type { RecordingEvent } from '@/lib/recording-system/types';
import type { BlockPreset } from '@/components/blocks/block-library';
import type { Block } from '@/lib/block-system/types';
import type { RecordingSession } from '@/lib/recording-system/types';

/**
 * Playback Page - Lesson playback with interactive canvas.
 * 
 * This is a demo page showing how to use the playback system.
 * In production, this would load a saved recording session.
 */
export default function PlaybackPage() {
  const [session, setSession] = useState<RecordingSession | null>(null);

  const {
    state: playbackState,
    bookmarks,
    play,
    pause,
    stop,
    seek,
    seekRelative,
    setSpeed,
    cycleSpeed,
    setVolume,
    mute,
    unmute,
    jumpToBookmark,
    addBookmark,
    loadSession,
  } = usePlayback({
    onEventTrigger: (event: RecordingEvent) => {
      console.log('Event triggered:', event);
      // Here you would replay the event on the canvas
      // e.g., move blocks, update parameters, etc.
    },
    onPlaybackEnd: () => {
      console.log('Playback ended');
    },
  });

  const handleBlockSelect = (preset: BlockPreset) => {
    console.log('Block selected from library:', preset);
  };

  const handleBlocksChange = (blocks: Block[]) => {
    console.log('Blocks updated:', blocks.length);
  };

  const handleLoadDemoSession = async () => {
    await loadSession({
      id: 'demo-session',
      events: [],
      audioSegments: [],
      duration: 60000,
    });
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card p-2">
        <h1 className="text-lg font-semibold">Lesson Playback</h1>
        {!session && (
          <button
            onClick={handleLoadDemoSession}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Load Demo Session
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <BlockLibrary onBlockSelect={handleBlockSelect} />
        <div className="flex-1">
          <GridCanvas onBlocksChange={handleBlocksChange} />
        </div>
      </div>

      {/* Playback Controls */}
      {session && (
        <div className="border-t border-border bg-card p-4">
          <PlaybackControls
            state={playbackState}
            bookmarks={bookmarks}
            onPlay={play}
            onPause={pause}
            onStop={stop}
            onSeek={seek}
            onSeekRelative={seekRelative}
            onSetSpeed={setSpeed}
            onCycleSpeed={cycleSpeed}
            onSetVolume={setVolume}
            onMute={mute}
            onUnmute={unmute}
            onJumpToBookmark={jumpToBookmark}
            onAddBookmark={addBookmark}
          />

          {/* Status Bar */}
          <PlaybackStatusBar
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            events={[]}
            bookmarks={bookmarks}
            audioSegments={[]}
            isPlaying={playbackState.status === 'playing'}
          />
        </div>
      )}
    </div>
  );
}
