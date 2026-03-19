/**
 * Event Replayer
 *
 * Replays recorded events in synchronization with audio playback.
 * Triggers callbacks when events should be executed.
 */

import type { RecordingEvent, RecordingEventType } from './types';

export interface EventReplayerConfig {
  lookAheadTime?: number; // ms ahead to queue events (default: 100)
  eventCallback?: (event: RecordingEvent) => void;
}

export class EventReplayer {
  private events: RecordingEvent[] = [];
  private currentTime = 0;
  private currentIndex = 0;
  private config: EventReplayerConfig;
  private processedEventIds: Set<string> = new Set();

  constructor(config: EventReplayerConfig = {}) {
    this.config = {
      lookAheadTime: 100,
      ...config,
    };
  }

  /**
   * Load events for playback
   */
  loadEvents(events: RecordingEvent[]): void {
    this.events = events.sort((a, b) => a.timestamp - b.timestamp);
    this.currentIndex = 0;
    this.processedEventIds.clear();
  }

  /**
   * Update current playback time and trigger due events
   */
  update(currentTime: number): RecordingEvent[] {
    this.currentTime = currentTime;
    const triggeredEvents: RecordingEvent[] = [];

    // Find events that should be triggered within the look-ahead window
    const lookAheadEnd = currentTime + this.config.lookAheadTime!;

    while (this.currentIndex < this.events.length) {
      const event = this.events[this.currentIndex];
      if (!event) break;
      
      // Skip already processed events
      if (this.processedEventIds.has(event.id)) {
        this.currentIndex++;
        continue;
      }

      // If event is in the past or within look-ahead window, trigger it
      if (event.timestamp <= lookAheadEnd) {
        if (event.timestamp <= currentTime) {
          // Event should have already happened - trigger immediately
          this.triggerEvent(event);
          triggeredEvents.push(event);
        }
        this.currentIndex++;
      } else {
        // Event is in the future beyond look-ahead - stop processing
        break;
      }
    }

    return triggeredEvents;
  }

  /**
   * Trigger a single event
   */
  private triggerEvent(event: RecordingEvent): void {
    this.processedEventIds.add(event.id);
    this.config.eventCallback?.(event);
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    this.currentTime = time;
    
    // Reset index to find events before current time
    this.currentIndex = 0;
    this.processedEventIds.clear();

    // Process all events up to current time immediately
    while (this.currentIndex < this.events.length) {
      const event = this.events[this.currentIndex];
      if (!event) break;
      if (event.timestamp <= time) {
        this.triggerEvent(event);
        this.currentIndex++;
      } else {
        break;
      }
    }
  }

  /**
   * Reset to beginning
   */
  reset(): void {
    this.currentTime = 0;
    this.currentIndex = 0;
    this.processedEventIds.clear();
  }

  /**
   * Get event at current index
   */
  getCurrentEvent(): RecordingEvent | undefined {
    return this.events[this.currentIndex];
  }

  /**
   * Get all events
   */
  getAllEvents(): RecordingEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: RecordingEventType): RecordingEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get bookmark events
   */
  getBookmarks(): RecordingEvent[] {
    return this.getEventsByType('BOOKMARK_CREATED');
  }

  /**
   * Get total event count
   */
  getTotalEvents(): number {
    return this.events.length;
  }

  /**
   * Get current event index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Jump to specific event by ID
   */
  jumpToEvent(eventId: string): number {
    const index = this.events.findIndex(event => event.id === eventId);
    if (index !== -1 && this.events[index]) {
      this.currentIndex = index;
      this.seek(this.events[index].timestamp);
    }
    return index;
  }

  /**
   * Jump to nearest event at time
   */
  jumpToTime(time: number): RecordingEvent | undefined {
    const event = this.events.find(
      event => Math.abs(event.timestamp - time) < 100 // Within 100ms
    );
    
    if (event) {
      this.jumpToEvent(event.id);
    }
    
    return event;
  }
}

export default EventReplayer;
