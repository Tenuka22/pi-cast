/**
 * useRecording Hook
 *
 * Main React hook for the recording system.
 * Combines audio recording, event capture, and synchronization.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioRecorder } from './audio-recorder';
import { EventRecorder } from './event-recorder';
import type {
  RecordingState,
  RecordingStatus,
  RecordingEventType,
  RecordingEventData,
  RecordingSession,
  RecordingMetadata,
  SilenceDetectionConfig,
  BlockPlacedData,
  BlockMovedData,
  VariableSliderChangedData,
  BookmarkCreatedData,
} from './types';

interface UseRecordingOptions {
  silenceConfig?: Partial<SilenceDetectionConfig>;
  metadata?: Partial<RecordingMetadata>;
  onStateChange?: (state: RecordingState) => void;
}

const INITIAL_STATE: RecordingState = {
  status: 'idle',
  startTime: null,
  currentTime: 0,
  events: [],
  audioSegments: [],
  currentSegment: null,
  error: null,
  metadata: {},
};

export function useRecording(options: UseRecordingOptions = {}) {
  const { silenceConfig, metadata: initialMetadata, onStateChange } = options;

  const [state, setState] = useState<RecordingState>({
    ...INITIAL_STATE,
    metadata: initialMetadata || {},
  });

  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const eventRecorderRef = useRef<EventRecorder | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  // Initialize recorders
  const initialize = useCallback(async () => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder(silenceConfig);
    }
    if (!eventRecorderRef.current) {
      eventRecorderRef.current = new EventRecorder();
    }
  }, [silenceConfig]);

  // Start recording
  const start = useCallback(async () => {
    try {
      await initialize();

      if (!audioRecorderRef.current || !eventRecorderRef.current) {
        throw new Error('Failed to initialize recorders');
      }

      // Start audio recording
      await audioRecorderRef.current.start();

      // Start event recording
      eventRecorderRef.current.start();

      // Add lesson started event
      eventRecorderRef.current.addEvent('LESSON_STARTED', {
        lessonId: initialMetadata?.lessonId,
        lessonTitle: initialMetadata?.lessonTitle,
      });

      const startTime = Date.now();

      setState((prev) => ({
        ...prev,
        status: 'recording',
        startTime,
        currentTime: 0,
        events: [],
        audioSegments: [],
        currentSegment: null,
        error: null,
        metadata: {
          ...prev.metadata,
          createdAt: startTime,
          ...initialMetadata,
        },
      }));

      // Start time update interval
      if (timeUpdateIntervalRef.current) {
        window.clearInterval(timeUpdateIntervalRef.current);
      }

      timeUpdateIntervalRef.current = window.setInterval(() => {
        if (audioRecorderRef.current && eventRecorderRef.current) {
          const currentTime = audioRecorderRef.current.getCurrentTime();
          const segments = audioRecorderRef.current.getSegments();
          const events = eventRecorderRef.current.getEvents();

          setState((prev) => {
            const newState = {
              ...prev,
              currentTime,
              audioSegments: segments,
              events,
              currentSegment: segments[segments.length - 1] || null,
            };

            onStateChange?.(newState);
            return newState;
          });

          // Update event recorder with latest segments
          eventRecorderRef.current.updateAudioSegments(segments);
        }
      }, 100); // Update every 100ms
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      let errorCode: RecordingState['error'] extends infer T ? T extends { code: infer C } ? C : 'UNKNOWN' : 'UNKNOWN' = 'UNKNOWN';

      if (errorMessage.includes('permission')) {
        errorCode = 'MIC_PERMISSION_DENIED';
      } else if (errorMessage.includes('microphone') || errorMessage.includes('found')) {
        errorCode = 'MIC_NOT_AVAILABLE';
      } else if (errorMessage.includes('recording')) {
        errorCode = 'RECORDING_FAILED';
      }

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: {
          code: errorCode,
          message: errorMessage,
        },
      }));

      throw error;
    }
  }, [initialize, initialMetadata, onStateChange]);

  // Stop recording
  const stop = useCallback(async (): Promise<RecordingSession | null> => {
    if (!audioRecorderRef.current || !eventRecorderRef.current) {
      return null;
    }

    // Clear time update interval
    if (timeUpdateIntervalRef.current) {
      window.clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    try {
      // Add lesson paused event before stopping
      eventRecorderRef.current.addEvent('LESSON_PAUSED', {
        reason: 'recording_stopped',
      });

      // Stop audio recording
      const audioSegments = await audioRecorderRef.current.stop();

      // Get all events
      const events = eventRecorderRef.current.getEvents();

      // Export session data
      const { duration } = eventRecorderRef.current.export();

      const session: RecordingSession = {
        id: `session-${Date.now()}`,
        metadata: {
          ...state.metadata,
          duration,
          totalEvents: events.length,
          totalSegments: audioSegments.length,
        },
        events,
        audioSegments,
        duration,
        createdAt: state.startTime || Date.now(),
      };

      setState((prev) => ({
        ...prev,
        status: 'stopped',
        currentTime: duration,
        events,
        audioSegments,
      }));

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: {
          code: 'RECORDING_FAILED',
          message: errorMessage,
        },
      }));
      return null;
    }
  }, [state.metadata, state.startTime]);

  // Pause recording
  const pause = useCallback(() => {
    if (!audioRecorderRef.current || !eventRecorderRef.current) return;

    audioRecorderRef.current.pause();

    // Add lesson paused event
    eventRecorderRef.current.addEvent('LESSON_PAUSED', {
      reason: 'user_paused',
    });

    // Clear time update interval
    if (timeUpdateIntervalRef.current) {
      window.clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      status: 'paused',
    }));
  }, []);

  // Resume recording
  const resume = useCallback(() => {
    if (!audioRecorderRef.current || !eventRecorderRef.current) return;

    audioRecorderRef.current.resume();

    // Add lesson resumed event
    eventRecorderRef.current.addEvent('LESSON_RESUMED', {});

    // Restart time update interval
    if (timeUpdateIntervalRef.current) {
      window.clearInterval(timeUpdateIntervalRef.current);
    }

    timeUpdateIntervalRef.current = window.setInterval(() => {
      if (audioRecorderRef.current && eventRecorderRef.current) {
        const currentTime = audioRecorderRef.current.getCurrentTime();
        const segments = audioRecorderRef.current.getSegments();
        const events = eventRecorderRef.current.getEvents();

        setState((prev) => {
          const newState = {
            ...prev,
            currentTime,
            audioSegments: segments,
            events,
            currentSegment: segments[segments.length - 1] || null,
          };

          onStateChange?.(newState);
          return newState;
        });

        eventRecorderRef.current.updateAudioSegments(segments);
      }
    }, 100);

    setState((prev) => ({
      ...prev,
      status: 'recording',
    }));
  }, [onStateChange]);

  // Add event
  const addEvent = useCallback(
    (type: RecordingEventType, data: RecordingEventData) => {
      if (!eventRecorderRef.current || state.status === 'idle' || state.status === 'stopped') {
        return;
      }

      const event = eventRecorderRef.current.addEvent(type, data);

      setState((prev) => ({
        ...prev,
        events: [...prev.events, event],
      }));
    },
    [state.status]
  );

  // Create bookmark
  const createBookmark = useCallback(
    (title: string, description?: string) => {
      if (!eventRecorderRef.current || state.status === 'idle' || state.status === 'stopped') {
        return;
      }

      const bookmarkId = `bookmark-${Date.now()}`;
      const event = eventRecorderRef.current.addEvent('BOOKMARK_CREATED', {
        bookmarkId,
        title,
        description,
        type: 'teacher',
      });

      setState((prev) => ({
        ...prev,
        events: [...prev.events, event],
      }));

      return bookmarkId;
    },
    [state.status]
  );

  // Record block placed event
  const recordBlockPlaced = useCallback(
    (blockId: string, blockType: string, position: { x: number; y: number }, equation?: string) => {
      addEvent('BLOCK_PLACED', {
        blockId,
        blockType,
        position,
        equation,
      } as BlockPlacedData);
    },
    [addEvent]
  );

  // Record block moved event
  const recordBlockMoved = useCallback(
    (
      blockId: string,
      fromPosition: { x: number; y: number },
      toPosition: { x: number; y: number }
    ) => {
      addEvent('BLOCK_MOVED', {
        blockId,
        fromPosition,
        toPosition,
      } as BlockMovedData);
    },
    [addEvent]
  );

  // Record variable slider changed event
  const recordVariableChanged = useCallback(
    (blockId: string, variableName: string, oldValue: number, newValue: number, equationId?: string) => {
      addEvent('VARIABLE_SLIDER_CHANGED', {
        blockId,
        variableName,
        oldValue,
        newValue,
        equationId,
      } as VariableSliderChangedData);
    },
    [addEvent]
  );

  // Reset recording state
  const reset = useCallback(() => {
    // Clear time update interval
    if (timeUpdateIntervalRef.current) {
      window.clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    // Destroy audio recorder
    if (audioRecorderRef.current) {
      audioRecorderRef.current.destroy();
      audioRecorderRef.current = null;
    }

    // Reset event recorder
    if (eventRecorderRef.current) {
      eventRecorderRef.current.reset();
    }

    setState(INITIAL_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateIntervalRef.current) {
        window.clearInterval(timeUpdateIntervalRef.current);
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.destroy();
      }
    };
  }, []);

  return {
    // State
    state,

    // Controls
    start,
    stop,
    pause,
    resume,
    reset,

    // Event recording
    addEvent,
    createBookmark,
    recordBlockPlaced,
    recordBlockMoved,
    recordVariableChanged,

    // Getters
    getEvents: () => eventRecorderRef.current?.getEvents() || [],
    getAudioSegments: () => audioRecorderRef.current?.getSegments() || [],
    getCurrentTime: () => audioRecorderRef.current?.getCurrentTime() || 0,
    isRecording: () => audioRecorderRef.current?.isCurrentlyRecording() || false,
    isPaused: () => audioRecorderRef.current?.isCurrentlyPaused() || false,
  };
}

export default useRecording;
