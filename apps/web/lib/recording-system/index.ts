/**
 * Recording System
 *
 * Event-driven recording and playback system for pi-cast lessons.
 * Captures teaching actions as discrete events synchronized with audio segments.
 */

// Types and interfaces
export * from './types';

// Audio recorder with silence detection
export { AudioRecorder } from './audio-recorder';

// Event recorder
export { EventRecorder } from './event-recorder';

// Audio playback engine
export { AudioPlaybackEngine } from './audio-playback';

// Event replayer
export { EventReplayer } from './event-replayer';

// Main recording hook
export { useRecording } from './use-recording';

// Main playback hook
export { usePlayback } from './use-playback';
