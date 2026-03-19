/**
 * Audio Playback Engine
 *
 * Handles playback of recorded audio segments with speed control,
 * volume adjustment, and precise time synchronization.
 */

import type { AudioSegment, PlaybackSpeed } from './types';

export class AudioPlaybackEngine {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private sourceNodes: Map<string, AudioBufferSourceNode> = new Map();
  private gainNode: GainNode | null = null;
  
  private segments: AudioSegment[] = [];
  private isPlaying = false;
  private isPaused = false;
  private playbackSpeed: PlaybackSpeed = 1;
  private volume = 1.0;
  private startTime = 0;
  private pauseTime = 0;
  private currentSegmentIndex = 0;
  private onSegmentEnd?: () => void;
  private onTimeUpdate?: (time: number) => void;
  private animationFrameId: number | null = null;

  constructor() {}

  /**
   * Initialize the audio playback engine
   */
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  /**
   * Load audio segments for playback
   */
  async loadSegments(audioSegments: AudioSegment[]): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    this.segments = audioSegments.filter(seg => seg.audioBlob && !seg.isSilence);
    this.audioBuffers.clear();

    // Decode all audio segments
    for (const segment of this.segments) {
      if (segment.audioBlob) {
        try {
          const arrayBuffer = await segment.audioBlob.arrayBuffer();
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(segment.id, audioBuffer);
        } catch (error) {
          console.error(`Failed to decode audio segment ${segment.id}:`, error);
        }
      }
    }
  }

  /**
   * Play from current position
   */
  play(): void {
    if (!this.audioContext || !this.gainNode || this.segments.length === 0) return;
    if (this.isPlaying && !this.isPaused) return;

    this.isPlaying = true;
    this.isPaused = false;

    if (this.pauseTime > 0) {
      // Resume from pause
      this.resumeFromTime(this.pauseTime);
    } else {
      // Start from beginning or current segment
      this.playFromSegment(this.currentSegmentIndex);
    }

    this.startTime = this.audioContext.currentTime - this.pauseTime / this.playbackSpeed;
    this.startMonitoring();
  }

  /**
   * Play from a specific segment index
   */
  private playFromSegment(index: number): void {
    if (index >= this.segments.length || !this.audioContext || !this.gainNode) return;

    this.currentSegmentIndex = index;
    const segment = this.segments[index];
    if (!segment) return;
    
    const audioBuffer = this.audioBuffers.get(segment.id);

    if (!audioBuffer) {
      // Move to next segment if current has no audio
      if (index < this.segments.length - 1) {
        this.playFromSegment(index + 1);
      }
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = this.playbackSpeed;
    source.connect(this.gainNode);

    source.onended = () => {
      if (this.isPlaying && !this.isPaused) {
        // Move to next segment
        if (this.currentSegmentIndex < this.segments.length - 1) {
          this.playFromSegment(this.currentSegmentIndex + 1);
        } else {
          // End of all segments
          this.stop();
          this.onSegmentEnd?.();
        }
      }
    };

    this.sourceNodes.set(segment.id, source);
    source.start(0);
  }

  /**
   * Resume playback from a specific time
   */
  private resumeFromTime(time: number): void {
    // Find the segment that contains this time
    const segmentIndex = this.findSegmentAtTime(time);
    if (segmentIndex === -1) return;

    const segment = this.segments[segmentIndex];
    if (!segment) return;
    
    const audioBuffer = this.audioBuffers.get(segment.id);

    if (!audioBuffer || !this.audioContext || !this.gainNode) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = this.playbackSpeed;
    source.connect(this.gainNode);

    // Calculate offset within segment
    const segmentOffset = time - segment.startTime;
    const offset = Math.max(0, segmentOffset / 1000); // Convert to seconds

    source.start(0, offset);
    this.sourceNodes.set(segment.id, source);
    this.currentSegmentIndex = segmentIndex;

    source.onended = () => {
      if (this.isPlaying && !this.isPaused) {
        if (this.currentSegmentIndex < this.segments.length - 1) {
          this.playFromSegment(this.currentSegmentIndex + 1);
        } else {
          this.stop();
          this.onSegmentEnd?.();
        }
      }
    };
  }

  /**
   * Find segment index at a given time
   */
  private findSegmentAtTime(time: number): number {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (segment && time >= segment.startTime && time <= segment.endTime) {
        return i;
      }
    }
    // If not found, return closest segment
    const firstSegment = this.segments[0];
    if (firstSegment && time < firstSegment.startTime) return 0;
    return this.segments.length - 1;
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.isPlaying) return;

    this.isPaused = true;
    this.pauseTime = this.getCurrentTime();

    // Stop all source nodes
    this.sourceNodes.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.sourceNodes.clear();

    this.stopMonitoring();
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseTime = 0;
    this.currentSegmentIndex = 0;

    // Stop all source nodes
    this.sourceNodes.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.sourceNodes.clear();

    this.stopMonitoring();
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    const wasPlaying = this.isPlaying && !this.isPaused;
    
    if (wasPlaying) {
      this.pause();
    }

    this.pauseTime = Math.max(0, Math.min(time, this.getTotalDuration()));
    this.currentSegmentIndex = this.findSegmentAtTime(this.pauseTime);

    if (wasPlaying) {
      // Small delay to ensure pause completes
      setTimeout(() => this.play(), 50);
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: PlaybackSpeed): void {
    this.playbackSpeed = speed;
    
    // Update speed of currently playing source
    this.sourceNodes.forEach((source) => {
      source.playbackRate.value = speed;
    });
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * Mute playback
   */
  mute(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
  }

  /**
   * Unmute playback
   */
  unmute(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext) {
      return this.pauseTime;
    }

    const elapsed = (this.audioContext.currentTime - this.startTime) * this.playbackSpeed;
    return Math.min(elapsed, this.getTotalDuration());
  }

  /**
   * Get total duration
   */
  getTotalDuration(): number {
    if (this.segments.length === 0) return 0;
    return Math.max(...this.segments.map(s => s.endTime));
  }

  /**
   * Get current segment index
   */
  getCurrentSegmentIndex(): number {
    return this.currentSegmentIndex;
  }

  /**
   * Check if currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  /**
   * Check if currently paused
   */
  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Set segment end callback
   */
  onSegmentEndCallback(callback: () => void): void {
    this.onSegmentEnd = callback;
  }

  /**
   * Set time update callback
   */
  onTimeUpdateCallback(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  /**
   * Start monitoring playback time
   */
  private startMonitoring(): void {
    const monitor = () => {
      if (this.isPlaying && !this.isPaused) {
        const currentTime = this.getCurrentTime();
        this.onTimeUpdate?.(currentTime);
        this.animationFrameId = requestAnimationFrame(monitor);
      }
    };
    this.animationFrameId = requestAnimationFrame(monitor);
  }

  /**
   * Stop monitoring playback time
   */
  private stopMonitoring(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    this.sourceNodes.clear();
    this.audioBuffers.clear();
    this.segments = [];

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
    }
  }
}

export default AudioPlaybackEngine;
