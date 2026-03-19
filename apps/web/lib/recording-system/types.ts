/**
 * Recording System Types and Interfaces
 *
 * Event-driven recording system for pi-cast lessons.
 * Captures teaching actions as discrete events synchronized with audio segments.
 */

// ============================================================================
// RECORDING EVENT TYPES
// ============================================================================

export type RecordingEventType =
  | 'BLOCK_PLACED'
  | 'BLOCK_MOVED'
  | 'BLOCK_DELETED'
  | 'BLOCK_RESIZED'
  | 'PARAMETER_CHANGED'
  | 'VARIABLE_SLIDER_CHANGED'
  | 'BOOKMARK_CREATED'
  | 'CANVAS_NAVIGATION'
  | 'ZOOM_CHANGED'
  | 'LESSON_STARTED'
  | 'LESSON_PAUSED'
  | 'LESSON_RESUMED';

export interface RecordingEvent {
  id: string;
  timestamp: number; // Milliseconds from recording start
  type: RecordingEventType;
  data: RecordingEventData;
  audioSegmentId?: string; // Reference to synchronized audio segment
}

export type RecordingEventData =
  | BlockPlacedData
  | BlockMovedData
  | BlockDeletedData
  | BlockResizedData
  | ParameterChangedData
  | VariableSliderChangedData
  | BookmarkCreatedData
  | CanvasNavigationData
  | ZoomChangedData
  | LessonStateData;

export interface BlockPlacedData {
  blockId: string;
  blockType: string;
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  equation?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface BlockMovedData {
  blockId: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
}

export interface BlockDeletedData {
  blockId: string;
  blockType: string;
}

export interface BlockResizedData {
  blockId: string;
  oldDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

export interface ParameterChangedData {
  blockId: string;
  parameterName: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface VariableSliderChangedData {
  blockId: string;
  variableName: string;
  oldValue: number;
  newValue: number;
  equationId?: string;
}

export interface BookmarkCreatedData {
  bookmarkId: string;
  title: string;
  description?: string;
  type: 'teacher' | 'student';
}

export interface CanvasNavigationData {
  viewport: { x: number; y: number; width: number; height: number };
  reason: 'user_action' | 'auto_scroll';
}

export interface ZoomChangedData {
  oldZoom: number;
  newZoom: number;
}

export interface LessonStateData {
  lessonId?: string;
  lessonTitle?: string;
  reason?: string;
}

// ============================================================================
// AUDIO SEGMENT TYPES
// ============================================================================

export interface AudioSegment {
  id: string;
  startTime: number; // Milliseconds from recording start
  endTime: number; // Milliseconds from recording start
  duration: number; // Duration in milliseconds
  audioData: Float32Array | null; // Raw audio samples (null if not yet recorded)
  audioBlob?: Blob; // Compressed audio blob
  isSilence: boolean; // Whether this segment is detected as silence
  transcript?: string; // Optional speech-to-text transcript
  quality: 'high' | 'medium' | 'low';
}

export interface SilenceDetectionConfig {
  threshold: number; // dB threshold for silence detection (default: -50)
  minSilenceDuration: number; // Minimum silence duration in ms (default: 500)
  minSpeechDuration: number; // Minimum speech duration in ms (default: 200)
  sampleRate: number; // Audio sample rate (default: 44100)
}

export const DEFAULT_SILENCE_CONFIG: SilenceDetectionConfig = {
  threshold: -50,
  minSilenceDuration: 500,
  minSpeechDuration: 200,
  sampleRate: 44100,
};

// ============================================================================
// RECORDING STATE TYPES
// ============================================================================

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface RecordingState {
  status: RecordingStatus;
  startTime: number | null; // Timestamp when recording started
  currentTime: number; // Current recording time in milliseconds
  events: RecordingEvent[];
  audioSegments: AudioSegment[];
  currentSegment: AudioSegment | null;
  error: RecordingError | null;
  metadata: RecordingMetadata;
}

export interface RecordingMetadata {
  lessonId?: string;
  lessonTitle?: string;
  creatorId?: string;
  createdAt?: number;
  duration?: number;
  totalEvents?: number;
  totalSegments?: number;
}

export interface RecordingError {
  code: 'MIC_PERMISSION_DENIED' | 'MIC_NOT_AVAILABLE' | 'RECORDING_FAILED' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

// ============================================================================
// RECORDING CONTROLS
// ============================================================================

export interface RecordingControls {
  start: () => Promise<void>;
  stop: () => Promise<RecordingSession | null>;
  pause: () => void;
  resume: () => void;
  addEvent: (type: RecordingEventType, data: RecordingEventData) => void;
  createBookmark: (title: string, description?: string) => void;
  reset: () => void;
}

export interface RecordingSession {
  id: string;
  metadata: RecordingMetadata;
  events: RecordingEvent[];
  audioSegments: AudioSegment[];
  duration: number;
  createdAt: number;
}

// ============================================================================
// PLAYBACK TYPES
// ============================================================================

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped' | 'seeking' | 'error';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTime: number; // Current playback time in milliseconds
  duration: number; // Total duration in milliseconds
  speed: PlaybackSpeed;
  currentEventIndex: number;
  currentSegmentIndex: number;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  error: PlaybackError | null;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface PlaybackError {
  code: 'AUDIO_NOT_AVAILABLE' | 'PLAYBACK_FAILED' | 'SEEK_FAILED' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void; // Seek forward/backward by delta ms
  setSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  jumpToEvent: (eventId: string) => void;
  jumpToBookmark: (bookmarkId: string) => void;
  jumpToSegment: (segmentIndex: number) => void;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  title: string;
  description?: string;
  type: 'teacher' | 'student';
  color?: string;
  createdAt: number;
}

export interface PlaybackSession {
  recordingId: string;
  events: RecordingEvent[];
  audioSegments: AudioSegment[];
  bookmarks: Bookmark[];
  duration: number;
}

// ============================================================================
// SYNC TYPES
// ============================================================================

export interface EventAudioSync {
  eventId: string;
  audioSegmentId: string;
  timeOffset: number; // Offset within the audio segment in milliseconds
  confidence: number; // Sync confidence score (0-1)
}

export interface SyncedTimeline {
  events: (RecordingEvent & { audioSegment?: AudioSegment })[];
  segments: (AudioSegment & { events: RecordingEvent[] })[];
  totalDuration: number;
}
