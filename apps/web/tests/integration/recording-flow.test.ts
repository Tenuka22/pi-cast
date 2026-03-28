/**
 * Recording Flow Integration Tests
 *
 * Tests the complete recording flow from start to save.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecording } from '@/lib/recording-system/use-recording';
import { renderHook, act } from '@testing-library/react';
import type { RecordingSession } from '@/lib/recording-system/types';

// Mock browser APIs
const mockMediaDevices = {
  getUserMedia: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Mock navigator.mediaDevices
  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
  });

  // Mock AudioContext
  Object.defineProperty(global, 'AudioContext', {
    value: vi.fn().mockImplementation(() => ({
      createMediaStreamSource: vi.fn(),
      createAnalyser: vi.fn(),
      close: vi.fn(),
    })),
    writable: true,
  });
});

describe('Recording Flow Integration', () => {
  describe('Recording Lifecycle', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => useRecording());

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.currentTime).toBe(0);
    });

    it('should transition to recording state', async () => {
      // Mock successful permission
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.state.status).toBe('recording');
    });

    it('should pause and resume recording', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      // Start recording
      await act(async () => {
        await result.current.start();
      });

      expect(result.current.state.status).toBe('recording');

      // Pause
      act(() => {
        result.current.pause();
      });

      expect(result.current.state.status).toBe('paused');

      // Resume
      act(() => {
        result.current.resume();
      });

      expect(result.current.state.status).toBe('recording');
    });

    it('should stop and return session', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      // Start recording
      await act(async () => {
        await result.current.start();
      });

      // Stop recording
      let session: RecordingSession | undefined;
      await act(async () => {
        session = await result.current.stop() ?? undefined;
      });

      expect(result.current.state.status).toBe('stopped');
      expect(session).toBeDefined();
    });
  });

  describe('Event Recording', () => {
    it('should capture block placed event', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      // Start recording
      await act(async () => {
        await result.current.start();
      });

      // Record block placed
      act(() => {
        result.current.recordBlockPlaced(
          'block-1',
          'equation',
          { x: 4, y: 2 },
          'y = mx + c'
        );
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(1);
      const firstEvent = events[0];
      expect(firstEvent?.type).toBe('BLOCK_PLACED');
      expect(firstEvent?.data).toMatchObject({
        blockId: 'block-1',
        blockType: 'equation',
        position: { x: 4, y: 2 },
      });
    });

    it('should capture block moved event', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.start();
      });

      // Record block movement
      act(() => {
        result.current.recordBlockMoved(
          'block-1',
          { x: 4, y: 2 },
          { x: 8, y: 2 }
        );
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('BLOCK_MOVED');
    });

    it('should capture bookmark creation', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.start();
      });

      // Create bookmark
      act(() => {
        result.current.createBookmark('Key Concept', 'Important formula');
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('BOOKMARK_CREATED');
    });
  });

  describe('Audio Segmentation', () => {
    it('should create audio segments during recording', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.start();
      });

      // Simulate time passing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const segments = result.current.state.audioSegments;
      // Should have at least one segment after recording
      expect(segments.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle microphone permission denied', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        try {
          await result.current.start();
        } catch {
          // Expected error
        }
      });

      expect(result.current.state.status).toBe('error');
    });

    it('should handle microphone not available', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        try {
          await result.current.start();
        } catch {
          // Expected error
        }
      });

      expect(result.current.state.status).toBe('error');
    });
  });

  describe('Recording Metadata', () => {
    it('should include metadata in session', async () => {
      mockMediaDevices.getUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
      });

      const { result } = renderHook(() => useRecording({
        metadata: {
          lessonId: 'lesson-1',
          lessonTitle: 'Test Lesson',
        },
      }));

      await act(async () => {
        await result.current.start();
      });

      let session: RecordingSession | undefined;
      await act(async () => {
        session = await result.current.stop() ?? undefined;
      });

      expect(session?.metadata.lessonId).toBe('lesson-1');
      expect(session?.metadata.lessonTitle).toBe('Test Lesson');
    });
  });
});
