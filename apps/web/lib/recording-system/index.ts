/**
 * Recording System
 *
 * Event-driven recording system for pi-cast lessons.
 * Captures teaching actions as discrete events synchronized with audio segments.
 */

// Types and interfaces
export * from './types';

// Audio recorder with silence detection
export { AudioRecorder } from './audio-recorder';

// Event recorder
export { EventRecorder } from './event-recorder';

// Main recording hook
export { useRecording } from './use-recording';
