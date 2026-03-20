/**
 * Event Recorder Unit Tests
 * 
 * Tests for event capture, synchronization, and replay logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventReplayer } from './event-replayer';
import type { RecordingEvent } from './types';

describe('EventReplayer', () => {
  let replayer: EventReplayer;

  beforeEach(() => {
    replayer = new EventReplayer({
      lookAheadTime: 100,
    });
  });

  describe('Initialization', () => {
    it('should create replayer with default config', () => {
      expect(replayer).toBeDefined();
    });

    it('should use custom look ahead time', () => {
      const customReplayer = new EventReplayer({ lookAheadTime: 200 });
      expect(customReplayer).toBeDefined();
    });
  });

  describe('Event Loading', () => {
    it('should load events sorted by timestamp', () => {
      const events: RecordingEvent[] = [
        { id: '3', timestamp: 3000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BLOCK_MOVED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const loadedEvents = replayer.getAllEvents();

      expect(loadedEvents[0]?.timestamp).toBe(1000);
      expect(loadedEvents[1]?.timestamp).toBe(2000);
      expect(loadedEvents[2]?.timestamp).toBe(3000);
    });

    it('should handle empty events array', () => {
      replayer.loadEvents([]);
      const events = replayer.getAllEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('Event Update', () => {
    it('should trigger events within look ahead window', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 50, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 150, type: 'BLOCK_MOVED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const triggered = replayer.update(100); // Current time: 100ms

      // Event at 50ms should be triggered (within look ahead)
      expect(triggered.length).toBeGreaterThan(0);
    });

    it('should not trigger future events beyond look ahead', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 500, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const triggered = replayer.update(100); // Current time: 100ms, look ahead ends at 200ms

      // Event at 500ms should not be triggered
      expect(triggered).toHaveLength(0);
    });

    it('should skip already processed events', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 50, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      replayer.update(100); // Process event
      const triggered = replayer.update(150); // Should not re-trigger

      expect(triggered).toHaveLength(0);
    });
  });

  describe('Seek Operations', () => {
    it('should reset to beginning on seek(0)', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      replayer.update(1500); // Process event
      replayer.seek(0);

      const currentIndex = replayer.getCurrentIndex();
      expect(currentIndex).toBe(0);
    });

    it('should process all events up to seek time', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BLOCK_MOVED', data: {} as any },
        { id: '3', timestamp: 3000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      replayer.seek(2500); // Seek to 2.5s

      // Should have processed events at 1s and 2s
      const currentIndex = replayer.getCurrentIndex();
      expect(currentIndex).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Event Navigation', () => {
    it('should jump to event by ID', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BLOCK_MOVED', data: {} as any },
        { id: '3', timestamp: 3000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const index = replayer.jumpToEvent('2');

      expect(index).toBe(1);
    });

    it('should return -1 for non-existent event', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const index = replayer.jumpToEvent('non-existent');

      expect(index).toBe(-1);
    });

    it('should find nearest event at time', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BLOCK_MOVED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const event = replayer.jumpToTime(1050); // Close to event 1

      expect(event).toBeDefined();
    });
  });

  describe('Event Filtering', () => {
    it('should get events by type', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BLOCK_MOVED', data: {} as any },
        { id: '3', timestamp: 3000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const placedEvents = replayer.getEventsByType('BLOCK_PLACED');

      expect(placedEvents).toHaveLength(2);
    });

    it('should get bookmark events', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BOOKMARK_CREATED', data: {} as any },
        { id: '3', timestamp: 3000, type: 'BOOKMARK_CREATED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const bookmarks = replayer.getBookmarks();

      expect(bookmarks).toHaveLength(2);
    });
  });

  describe('State Queries', () => {
    it('should return total event count', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
        { id: '2', timestamp: 2000, type: 'BLOCK_MOVED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const count = replayer.getTotalEvents();

      expect(count).toBe(2);
    });

    it('should return current event index', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      replayer.update(1500);

      const index = replayer.getCurrentIndex();
      expect(index).toBeGreaterThan(0);
    });

    it('should get current event', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      const event = replayer.getCurrentEvent();

      expect(event).toBeDefined();
      expect(event?.id).toBe('1');
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      const events: RecordingEvent[] = [
        { id: '1', timestamp: 1000, type: 'BLOCK_PLACED', data: {} as any },
      ];

      replayer.loadEvents(events);
      replayer.update(1500);
      replayer.reset();

      expect(replayer.getCurrentIndex()).toBe(0);
    });
  });
});
