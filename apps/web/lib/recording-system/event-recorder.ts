/**
 * Event Recorder
 *
 * Captures and manages recording events with precise timestamps.
 * Handles event-audio synchronization.
 */

import type {
  RecordingEvent,
  RecordingEventType,
  RecordingEventData,
  AudioSegment,
  EventAudioSync,
  SyncedTimeline,
} from './types';

export class EventRecorder {
  private events: RecordingEvent[] = [];
  private startTime: number | null = null;
  private audioSegments: AudioSegment[] = [];
  private syncMap: Map<string, EventAudioSync> = new Map();

  /**
   * Start event recording
   */
  start(): void {
    this.events = [];
    this.audioSegments = [];
    this.syncMap.clear();
    this.startTime = Date.now();
  }

  /**
   * Get current timestamp relative to recording start
   */
  getCurrentTimestamp(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Add a recording event
   */
  addEvent(type: RecordingEventType, data: RecordingEventData): RecordingEvent {
    const event: RecordingEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: this.getCurrentTimestamp(),
      type,
      data,
    };

    // Try to synchronize with current audio segment
    this.synchronizeEventWithAudio(event);

    this.events.push(event);
    return event;
  }

  /**
   * Synchronize an event with the nearest audio segment
   */
  private synchronizeEventWithAudio(event: RecordingEvent): void {
    if (this.audioSegments.length === 0) return;

    // Find the audio segment that contains or is closest to this event
    const currentSegment = this.audioSegments.find(
      (segment) => event.timestamp >= segment.startTime && event.timestamp <= segment.endTime
    );

    if (currentSegment) {
      const timeOffset = event.timestamp - currentSegment.startTime;
      const sync: EventAudioSync = {
        eventId: event.id,
        audioSegmentId: currentSegment.id,
        timeOffset,
        confidence: this.calculateSyncConfidence(event, currentSegment),
      };

      this.syncMap.set(event.id, sync);
      event.audioSegmentId = currentSegment.id;
    } else {
      // Find nearest segment
      const nearestSegment = this.audioSegments.reduce((nearest, segment) => {
        const distanceToNearest = nearest
          ? Math.abs(event.timestamp - (nearest.startTime + nearest.endTime) / 2)
          : Infinity;
        const distanceToCurrent = Math.abs(event.timestamp - (segment.startTime + segment.endTime) / 2);
        return distanceToCurrent < distanceToNearest ? segment : nearest;
      }, null as AudioSegment | null);

      if (nearestSegment) {
        const timeOffset = event.timestamp - nearestSegment.startTime;
        const sync: EventAudioSync = {
          eventId: event.id,
          audioSegmentId: nearestSegment.id,
          timeOffset,
          confidence: 0.5, // Lower confidence for non-contained events
        };

        this.syncMap.set(event.id, sync);
        event.audioSegmentId = nearestSegment.id;
      }
    }
  }

  /**
   * Calculate sync confidence score (0-1)
   */
  private calculateSyncConfidence(event: RecordingEvent, segment: AudioSegment): number {
    // Higher confidence if event is in the middle of the segment
    const segmentMidpoint = (segment.startTime + segment.endTime) / 2;
    const distanceFromMidpoint = Math.abs(event.timestamp - segmentMidpoint);
    const segmentDuration = segment.duration || 1;

    // Confidence decreases as we move away from the midpoint
    const normalizedDistance = distanceFromMidpoint / (segmentDuration / 2);
    return Math.max(0, 1 - normalizedDistance);
  }

  /**
   * Update audio segments (called when audio recording updates)
   */
  updateAudioSegments(segments: AudioSegment[]): void {
    this.audioSegments = segments;

    // Re-synchronize all events with updated segments
    this.events.forEach((event) => {
      this.synchronizeEventWithAudio(event);
    });
  }

  /**
   * Get all recorded events
   */
  getEvents(): RecordingEvent[] {
    return [...this.events];
  }

  /**
   * Get events within a time range
   */
  getEventsInRange(startTime: number, endTime: number): RecordingEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get event by ID
   */
  getEventById(eventId: string): RecordingEvent | undefined {
    return this.events.find((event) => event.id === eventId);
  }

  /**
   * Get sync information for an event
   */
  getEventSync(eventId: string): EventAudioSync | undefined {
    return this.syncMap.get(eventId);
  }

  /**
   * Get synced timeline (events merged with audio segments)
   */
  getSyncedTimeline(): SyncedTimeline {
    const syncedEvents = this.events.map((event) => {
      const audioSegment = this.audioSegments.find(
        (segment) => segment.id === event.audioSegmentId
      );
      return { ...event, audioSegment };
    });

    const syncedSegments = this.audioSegments.map((segment) => {
      const events = this.events.filter((event) => event.audioSegmentId === segment.id);
      return { ...segment, events };
    });

    const totalDuration =
      this.audioSegments.length > 0
        ? Math.max(...this.audioSegments.map((s) => s.endTime))
        : 0;

    return {
      events: syncedEvents,
      segments: syncedSegments,
      totalDuration,
    };
  }

  /**
   * Export recording session data
   */
  export(): {
    events: RecordingEvent[];
    audioSegments: AudioSegment[];
    duration: number;
    syncMap: Map<string, EventAudioSync>;
  } {
    return {
      events: [...this.events],
      audioSegments: [...this.audioSegments],
      duration: this.events.length > 0 ? Math.max(...this.events.map((e) => e.timestamp)) : 0,
      syncMap: new Map(this.syncMap),
    };
  }

  /**
   * Reset event recorder
   */
  reset(): void {
    this.events = [];
    this.audioSegments = [];
    this.syncMap.clear();
    this.startTime = null;
  }
}

export default EventRecorder;
