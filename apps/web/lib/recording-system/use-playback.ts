/**
 * usePlayback Hook
 *
 * Main React hook for the playback system.
 * Combines audio playback, event replay, and synchronization.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioPlaybackEngine } from './audio-playback';
import { EventReplayer } from './event-replayer';
import type {
  PlaybackState,
  PlaybackStatus,
  PlaybackSpeed,
  PlaybackSession,
  Bookmark,
  RecordingEvent,
  AudioSegment,
} from './types';

interface UsePlaybackOptions {
  onEventTrigger?: (event: RecordingEvent) => void;
  onPlaybackEnd?: () => void;
}

const INITIAL_STATE: PlaybackState = {
  status: 'idle',
  currentTime: 0,
  duration: 0,
  speed: 1,
  currentEventIndex: 0,
  currentSegmentIndex: 0,
  isMuted: false,
  volume: 1.0,
  error: null,
};

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function usePlayback(options: UsePlaybackOptions = {}) {
  const { onEventTrigger, onPlaybackEnd } = options;

  const [state, setState] = useState<PlaybackState>(INITIAL_STATE);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [session, setSession] = useState<PlaybackSession | null>(null);

  const audioEngineRef = useRef<AudioPlaybackEngine | null>(null);
  const eventReplayerRef = useRef<EventReplayer | null>(null);

  // Initialize playback engines
  const initialize = useCallback(async () => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioPlaybackEngine();
      await audioEngineRef.current.initialize();
    }
    if (!eventReplayerRef.current) {
    eventReplayerRef.current = new EventReplayer({
      lookAheadTime: 100,
      eventCallback: onEventTrigger,
    });
    }
  }, [onEventTrigger]);

  // Load a playback session
  const loadSession = useCallback(
    async (recordingSession: {
      id: string;
      events: RecordingEvent[];
      audioSegments: AudioSegment[];
      duration: number;
    }) => {
      await initialize();

      if (!audioEngineRef.current || !eventReplayerRef.current) {
        throw new Error('Failed to initialize playback engines');
      }

      // Extract bookmarks from events
      const extractedBookmarks: Bookmark[] = recordingSession.events
        .filter((event) => event.type === 'BOOKMARK_CREATED')
        .map((event) => ({
          id: (event.data as any).bookmarkId,
          timestamp: event.timestamp,
          title: (event.data as any).title,
          description: (event.data as any).description,
          type: (event.data as any).type,
          createdAt: recordingSession.duration,
        }));

      setBookmarks(extractedBookmarks);

      // Set session data
      const playbackSession: PlaybackSession = {
        recordingId: recordingSession.id,
        events: recordingSession.events,
        audioSegments: recordingSession.audioSegments,
        bookmarks: extractedBookmarks,
        duration: recordingSession.duration,
      };

      setSession(playbackSession);

      // Load audio segments
      await audioEngineRef.current.loadSegments(recordingSession.audioSegments);

      // Load events
      eventReplayerRef.current.loadEvents(recordingSession.events);

      // Update state
      setState((prev) => ({
        ...prev,
        duration: recordingSession.duration,
        currentTime: 0,
        status: 'idle',
      }));

      // Set up callbacks
      audioEngineRef.current.onSegmentEndCallback(() => {
        onPlaybackEnd?.();
        setState((prev) => ({ ...prev, status: 'stopped' }));
      });

      audioEngineRef.current.onTimeUpdateCallback((time) => {
        const triggeredEvents = eventReplayerRef.current?.update(time) || [];
        
        setState((prev) => ({
          ...prev,
          currentTime: time,
          currentSegmentIndex: audioEngineRef.current?.getCurrentSegmentIndex() || 0,
          currentEventIndex: eventReplayerRef.current?.getCurrentIndex() || 0,
        }));
      });
    },
    [initialize, onPlaybackEnd]
  );

  // Play
  const play = useCallback(() => {
    if (!audioEngineRef.current || state.status === 'idle' || !session) return;

    audioEngineRef.current.play();
    setState((prev) => ({ ...prev, status: 'playing' }));
  }, [state.status, session]);

  // Pause
  const pause = useCallback(() => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.pause();
    setState((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  // Stop
  const stop = useCallback(() => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.stop();
    eventReplayerRef.current?.reset();
    setState((prev) => ({
      ...prev,
      status: 'stopped',
      currentTime: 0,
      currentEventIndex: 0,
      currentSegmentIndex: 0,
    }));
  }, []);

  // Seek
  const seek = useCallback((time: number) => {
    if (!audioEngineRef.current || !eventReplayerRef.current) return;

    const clampedTime = Math.max(0, Math.min(time, state.duration));
    audioEngineRef.current.seek(clampedTime);
    eventReplayerRef.current.seek(clampedTime);

    setState((prev) => ({
      ...prev,
      currentTime: clampedTime,
      status: audioEngineRef.current?.isCurrentlyPlaying() ? 'playing' : 'paused',
    }));
  }, [state.duration]);

  // Seek relative (forward/backward)
  const seekRelative = useCallback(
    (delta: number) => {
      seek(state.currentTime + delta);
    },
    [seek, state.currentTime]
  );

  // Set speed
  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.setSpeed(speed);
    setState((prev) => ({ ...prev, speed }));
  }, []);

  // Cycle through speeds
  const cycleSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(state.speed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const nextSpeed = PLAYBACK_SPEEDS[nextIndex];
    if (nextSpeed) {
      setSpeed(nextSpeed);
    }
  }, [state.speed, setSpeed]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.setVolume(volume);
    setState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  // Mute
  const mute = useCallback(() => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.mute();
    setState((prev) => ({ ...prev, isMuted: true }));
  }, []);

  // Unmute
  const unmute = useCallback(() => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.unmute();
    setState((prev) => ({ ...prev, isMuted: false }));
  }, []);

  // Jump to event
  const jumpToEvent = useCallback((eventId: string) => {
    if (!eventReplayerRef.current) return;

    const index = eventReplayerRef.current.jumpToEvent(eventId);
    const events = eventReplayerRef.current.getAllEvents();
    const event = events[index];
    if (index !== -1 && event) {
      seek(event.timestamp);
    }
  }, [seek]);

  // Jump to bookmark
  const jumpToBookmark = useCallback(
    (bookmarkId: string) => {
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark) {
        seek(bookmark.timestamp);
      }
    },
    [bookmarks, seek]
  );

  // Jump to segment
  const jumpToSegment = useCallback(
    (segmentIndex: number) => {
      if (!session) return;

      const segment = session.audioSegments[segmentIndex];
      if (segment) {
        seek(segment.startTime);
      }
    },
    [session, seek]
  );

  // Add student bookmark
  const addBookmark = useCallback(
    (title: string, description?: string) => {
      const bookmark: Bookmark = {
        id: `bookmark-${Date.now()}`,
        timestamp: state.currentTime,
        title,
        description,
        type: 'student',
        createdAt: Date.now(),
      };

      setBookmarks((prev) => [...prev, bookmark]);
      return bookmark;
    },
    [state.currentTime]
  );

  // Remove bookmark
  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  }, []);

  // Get next speed
  const getNextSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(state.speed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    return PLAYBACK_SPEEDS[nextIndex];
  }, [state.speed]);

  // Get available speeds
  const getAvailableSpeeds = useCallback(() => PLAYBACK_SPEEDS, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.destroy();
      }
    };
  }, []);

  return {
    // State
    state,
    session,
    bookmarks,

    // Controls
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
    jumpToEvent,
    jumpToBookmark,
    jumpToSegment,

    // Bookmarks
    addBookmark,
    removeBookmark,

    // Load session
    loadSession,

    // Getters
    getNextSpeed,
    getAvailableSpeeds,
    isPlaying: () => audioEngineRef.current?.isCurrentlyPlaying() || false,
    isPaused: () => audioEngineRef.current?.isCurrentlyPaused() || false,
  };
}

export default usePlayback;
