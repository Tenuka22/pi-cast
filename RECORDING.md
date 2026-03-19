# 🎙️ Recording System Documentation

Complete implementation of the event-driven recording system for pi-cast.

---

## 📋 Implementation Summary

All Recording System features from LAUNCH.md have been implemented:

- ✅ **Event-driven action capture** - Captures teaching actions as discrete events
- ✅ **Audio recording with silence detection** - Records audio with configurable silence threshold
- ✅ **Audio segmentation (___ / ____ pattern)** - Automatically splits audio into speech/silence segments
- ✅ **Event-audio synchronization** - Synchronizes events with corresponding audio segments
- ✅ **Recording start/stop controls** - Full recording controls UI
- ✅ **Pause/resume functionality** - Pause and resume recording without losing state

---

## 🏗️ Architecture

### File Structure

```
apps/web/
├── lib/recording-system/
│   ├── types.ts              # Type definitions and interfaces
│   ├── audio-recorder.ts     # Audio recording with silence detection
│   ├── event-recorder.ts     # Event capture and synchronization
│   ├── use-recording.ts      # Main React hook
│   └── index.ts              # Module exports
├── components/recording/
│   ├── recording-controls.tsx    # Start/stop/pause/resume UI
│   └── recording-status-bar.tsx  # Timeline and segment visualization
└── components/blocks/
    └── grid-canvas.tsx       # Integrated with recording system
```

---

## 🔧 Core Components

### 1. Types (`lib/recording-system/types.ts`)

#### Recording Events
```typescript
type RecordingEventType =
  | 'BLOCK_PLACED'
  | 'BLOCK_MOVED'
  | 'PARAMETER_CHANGED'
  | 'VARIABLE_SLIDER_CHANGED'
  | 'BOOKMARK_CREATED'
  | 'LESSON_STARTED'
  | 'LESSON_PAUSED'
  | 'LESSON_RESUMED';
```

#### Audio Segments
```typescript
interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  audioData: Float32Array | null;
  audioBlob?: Blob;
  isSilence: boolean;
  quality: 'high' | 'medium' | 'low';
}
```

#### Recording State
```typescript
type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

interface RecordingState {
  status: RecordingStatus;
  startTime: number | null;
  currentTime: number;
  events: RecordingEvent[];
  audioSegments: AudioSegment[];
  currentSegment: AudioSegment | null;
  error: RecordingError | null;
  metadata: RecordingMetadata;
}
```

---

### 2. Audio Recorder (`lib/recording-system/audio-recorder.ts`)

Handles microphone input, silence detection, and automatic segmentation.

#### Key Features:
- **Silence Detection**: Configurable dB threshold (-50dB default)
- **Auto-segmentation**: Splits audio into speech/silence segments
- **Pause/Resume**: Maintains state during pauses
- **Real-time Monitoring**: Uses Web Audio API analyser

#### Usage:
```typescript
const recorder = new AudioRecorder({
  threshold: -50,           // dB threshold for silence
  minSilenceDuration: 500,  // ms before detecting silence
  minSpeechDuration: 200,   // ms before detecting speech
  sampleRate: 44100,
});

await recorder.initialize();
await recorder.start();
recorder.pause();
recorder.resume();
const segments = await recorder.stop();
```

#### Silence Detection Algorithm:
1. Continuously monitors audio amplitude using RMS (Root Mean Square)
2. When amplitude drops below threshold, starts silence timer
3. After `minSilenceDuration`, creates new silence segment
4. When amplitude rises above threshold, starts speech timer
5. After `minSpeechDuration`, creates new speech segment
6. Results in alternating ___ / ____ pattern

---

### 3. Event Recorder (`lib/recording-system/event-recorder.ts`)

Captures and manages teaching events with precise timestamps.

#### Key Features:
- **Event Capture**: Records actions with millisecond precision
- **Auto-Synchronization**: Automatically links events to audio segments
- **Confidence Scoring**: Rates sync quality (0-1)
- **Timeline Export**: Provides merged event+audio timeline

#### Usage:
```typescript
const eventRecorder = new EventRecorder();
eventRecorder.start();

eventRecorder.addEvent('BLOCK_PLACED', {
  blockId: 'eq-001',
  blockType: 'equation',
  position: { x: 4, y: 2 },
  equation: 'y = mx + c'
});

const { events, audioSegments, syncMap } = eventRecorder.export();
```

#### Synchronization Logic:
- Events are matched to containing audio segments
- Confidence score based on distance from segment midpoint
- Events outside segments matched to nearest segment (lower confidence)

---

### 4. useRecording Hook (`lib/recording-system/use-recording.ts`)

Main React hook combining audio and event recording.

#### API:
```typescript
const {
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
  getEvents,
  getAudioSegments,
  getCurrentTime,
  isRecording,
  isPaused,
} = useRecording({
  silenceConfig: { threshold: -50 },
  metadata: { lessonTitle: 'My Lesson' },
  onStateChange: (state) => console.log(state),
});
```

#### State Updates:
- Updates every 100ms during recording
- Triggers `onStateChange` callback
- Maintains synchronized events and segments

---

### 5. Recording Controls UI (`components/recording/recording-controls.tsx`)

User interface for recording operations.

#### Features:
- **Recording Indicator**: Pulsing red dot with timer
- **Start Button**: Begin recording session
- **Pause/Resume**: Toggle recording state
- **Stop**: End and save recording
- **Bookmark**: Add timestamped markers with title/description

#### Usage:
```tsx
<RecordingControls
  isRecording={recordingState.status === 'recording'}
  isPaused={recordingState.status === 'paused'}
  currentTime={recordingState.currentTime}
  onStart={startRecording}
  onStop={stopRecording}
  onPause={pauseRecording}
  onResume={resumeRecording}
  onCreateBookmark={(title, desc) => createBookmark(title, desc)}
/>
```

---

### 6. Recording Status Bar (`components/recording/recording-status-bar.tsx`)

Visual timeline and status display.

#### Features:
- **Timeline Visualization**: Shows audio segments as colored bars
  - Primary color = speech segments
  - Muted = silence segments
- **Event Markers**: Yellow indicators on timeline
- **Playhead**: Red line showing current position
- **Statistics**: Segment count, event count, recent events

---

## 🔗 Integration with GridCanvas

The recording system is fully integrated with the GridCanvas component:

### Block Placement Recording
```typescript
const addBlock = (type: Block['type'], data: Record<string, unknown>) => {
  // ... create block logic
  
  // Record event if recording
  recordBlockPlaced(blockWithPosition.id, type, validPosition, equation);
};
```

### Block Movement Recording
```typescript
const handleDragEnd = useCallback(() => {
  // ... drag end logic
  
  // Record movement if position changed
  recordBlockMoved(block.id, dragState.startPosition, validPosition);
}, [recordBlockMoved]);
```

---

## 📊 Event Types Captured

| Event Type | Data Captured | Triggered When |
|------------|---------------|----------------|
| `BLOCK_PLACED` | Block ID, type, position, equation | New block added to canvas |
| `BLOCK_MOVED` | Block ID, from/to positions | Block dragged to new position |
| `VARIABLE_SLIDER_CHANGED` | Variable name, old/new values | Slider/input adjusted |
| `BOOKMARK_CREATED` | Bookmark ID, title, description | User creates bookmark |
| `LESSON_STARTED` | Lesson metadata | Recording starts |
| `LESSON_PAUSED` | Reason | Recording paused/stopped |
| `LESSON_RESUMED` | - | Recording resumed |

---

## 🎯 Audio Segmentation Pattern

The system implements the **___ / ____** pattern:

```
Timeline:  0ms          2000ms       4000ms       6000ms
           |------------|-----------|------------|
Audio:     [  Speech   ] [ Silence ] [  Speech   ]
Events:        ●  ●         ○           ●
```

- **Speech segments** (____): Amplitude above threshold
- **Silence segments** (___): Amplitude below threshold
- **Events** (●): Automatically synchronized to nearest segment

### Configuration

```typescript
const silenceConfig = {
  threshold: -50,           // dB level for silence detection
  minSilenceDuration: 500,  // ms of silence before segment split
  minSpeechDuration: 200,   // ms of speech before segment split
  sampleRate: 44100,        // Audio quality
};
```

---

## 🚀 Usage Example

### Basic Recording Session

```tsx
import { GridCanvas } from '@/components/blocks/grid-canvas';
import { useRecording } from '@/lib/recording-system/use-recording';

function LessonCreator() {
  const {
    state,
    start,
    stop,
    pause,
    resume,
    createBookmark,
  } = useRecording({
    metadata: {
      lessonId: 'lesson-123',
      lessonTitle: 'Introduction to Linear Equations',
    },
  });

  return (
    <div>
      <RecordingControls
        isRecording={state.status === 'recording'}
        isPaused={state.status === 'paused'}
        currentTime={state.currentTime}
        onStart={start}
        onStop={stop}
        onPause={pause}
        onResume={resume}
        onCreateBookmark={createBookmark}
      />
      <GridCanvas />
      {state.status !== 'idle' && (
        <RecordingStatusBar
          isRecording={state.status === 'recording'}
          isPaused={state.status === 'paused'}
          currentTime={state.currentTime}
          events={state.events}
          audioSegments={state.audioSegments}
        />
      )}
    </div>
  );
}
```

### Export Recording Session

```typescript
const session = await stop();

if (session) {
  console.log('Session ID:', session.id);
  console.log('Duration:', session.duration, 'ms');
  console.log('Total Events:', session.metadata.totalEvents);
  console.log('Total Segments:', session.metadata.totalSegments);
  
  // Export for storage
  const exportData = {
    metadata: session.metadata,
    events: session.events,
    audioSegments: session.audioSegments.map(seg => ({
      id: seg.id,
      startTime: seg.startTime,
      endTime: seg.endTime,
      duration: seg.duration,
      isSilence: seg.isSilence,
      audioBlob: seg.audioBlob, // Can be uploaded to storage
    })),
  };
}
```

---

## 🔍 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |

### Required APIs:
- `MediaDevices.getUserMedia()` - Microphone access
- `AudioContext` - Audio processing
- `MediaRecorder` - Audio recording
- `AnalyserNode` - Real-time audio analysis

---

## 📝 Error Handling

The system handles common errors:

```typescript
try {
  await start();
} catch (error) {
  if (error.message.includes('permission')) {
    // MIC_PERMISSION_DENIED
    alert('Please allow microphone access');
  } else if (error.message.includes('microphone')) {
    // MIC_NOT_AVAILABLE
    alert('No microphone found');
  } else {
    // RECORDING_FAILED
    alert('Recording failed');
  }
}
```

---

## 🎯 Testing Checklist

### Manual Testing
- [ ] Request microphone permission
- [ ] Start recording session
- [ ] Place blocks on canvas (verify events captured)
- [ ] Move blocks (verify movement events)
- [ ] Pause recording (verify timer stops)
- [ ] Resume recording (verify timer continues)
- [ ] Create bookmark with title/description
- [ ] Stop recording (verify session exported)
- [ ] Check audio segments in status bar
- [ ] Verify speech/silence segmentation

### Edge Cases
- [ ] Recording without microphone permission
- [ ] Very short recordings (< 1 second)
- [ ] Very long recordings (> 1 hour)
- [ ] Multiple pause/resume cycles
- [ ] Rapid block placement during speech
- [ ] Silence detection in noisy environment

---

## 🔮 Future Enhancements

### Phase 2 (Playback System)
- [ ] Standard player controls (play, pause, rewind, forward)
- [ ] Event replay system
- [ ] Audio playback synchronization
- [ ] Speed control (0.5x, 1x, 1.5x, 2x)
- [ ] Progress bar with event markers

### Advanced Features
- [ ] Speech-to-text transcription
- [ ] Audio compression optimization
- [ ] Multi-track audio support
- [ ] Background noise reduction
- [ ] Audio quality settings
- [ ] Retake specific sections

---

## 📚 Related Documentation

- [LAUNCH.md](./LAUNCH.md) - Launch checklist
- [PRODUCT.md](./PRODUCT.md) - Product specifications
- [README.md](./README.md) - Project overview

---

**Last Updated**: March 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete
