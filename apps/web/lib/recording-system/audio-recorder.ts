/**
 * Audio Recorder with Silence Detection
 *
 * Handles audio recording, silence detection, and automatic segmentation.
 * Implements the ___ / ____ pattern (speech/silence alternation).
 */

import {
  AudioSegment,
  SilenceDetectionConfig,
  DEFAULT_SILENCE_CONFIG,
} from './types';

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Float32Array | null = null;

  private config: SilenceDetectionConfig;
  private segments: AudioSegment[] = [];
  private currentSegment: AudioSegment | null = null;
  private isRecording = false;
  private isPaused = false;
  private startTime = 0;
  private pauseTime = 0;
  private totalPausedTime = 0;
  private lastPauseStart = 0;

  private silenceTimer: number | null = null;
  private speechTimer: number | null = null;
  private animationFrameId: number | null = null;
  private audioChunks: Blob[] = [];
  private currentSegmentChunks: Blob[] = [];

  constructor(config: Partial<SilenceDetectionConfig> = {}) {
    this.config = { ...DEFAULT_SILENCE_CONFIG, ...config };
  }

  /**
   * Initialize the audio recorder and request microphone permissions
   */
  async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Float32Array(bufferLength);

      // Initialize MediaRecorder with supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio mime type found');
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.currentSegmentChunks.push(event.data);
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No microphone found');
        }
      }
      throw error;
    }
  }

  /**
   * Calculate the current RMS (Root Mean Square) amplitude in dB
   */
  private getCurrentAmplitude(): number {
    if (!this.analyser || !this.dataArray) return -100;

    this.analyser.getFloatTimeDomainData(this.dataArray as Float32Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const sample = this.dataArray[i] || 0;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    // Convert to dB (with floor to avoid -Infinity)
    return 20 * Math.log10(Math.max(rms, 0.00001));
  }

  /**
   * Create a new audio segment
   */
  private createSegment(isSilence: boolean): AudioSegment {
    const elapsed = this.getElapsedTime();
    return {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: elapsed,
      endTime: elapsed,
      duration: 0,
      audioData: null,
      isSilence,
      quality: 'high',
    };
  }

  /**
   * Get elapsed recording time (excluding pauses)
   */
  private getElapsedTime(): number {
    if (!this.startTime || this.isPaused) {
      return this.pauseTime;
    }
    return Date.now() - this.startTime - this.totalPausedTime;
  }

  /**
   * Finalize the current segment and create a new one
   */
  private finalizeSegment(): void {
    if (!this.currentSegment) return;

    const endTime = this.getElapsedTime();
    this.currentSegment.endTime = endTime;
    this.currentSegment.duration = endTime - this.currentSegment.startTime;

    // Create audio blob from chunks
    if (this.currentSegmentChunks.length > 0) {
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      const blob = new Blob(this.currentSegmentChunks, { type: mimeType });
      this.currentSegment.audioBlob = blob;
    }

    // Only keep segments with meaningful duration
    if (this.currentSegment.duration >= this.config.minSpeechDuration) {
      this.segments.push(this.currentSegment);
    }

    this.currentSegmentChunks = [];
  }

  /**
   * Monitor audio levels and detect silence/speech transitions
   */
  private monitorAudioLevel(): void {
    const amplitude = this.getCurrentAmplitude();
    const isSilent = amplitude < this.config.threshold;
    const currentTime = this.getElapsedTime();

    if (!this.currentSegment) {
      // Start first segment
      this.currentSegment = this.createSegment(isSilent);
    }

    // Handle silence detection
    if (isSilent) {
      if (!this.isPaused && this.currentSegment && !this.currentSegment.isSilence) {
        // Potential end of speech - start silence timer
        if (this.speechTimer) {
          clearTimeout(this.speechTimer);
        }
        this.silenceTimer = window.setTimeout(() => {
          if (this.isRecording && !this.isPaused) {
            this.finalizeSegment();
            this.currentSegment = this.createSegment(true);
          }
        }, this.config.minSilenceDuration);
      }
    } else {
      // Speech detected
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      if (this.currentSegment?.isSilence) {
        // End of silence - start speech timer
        if (!this.speechTimer) {
          this.speechTimer = window.setTimeout(() => {
            if (this.isRecording && !this.isPaused) {
              this.finalizeSegment();
              this.currentSegment = this.createSegment(false);
            }
          }, this.config.minSpeechDuration);
        }
      }
    }

    // Update current segment end time
    if (this.currentSegment) {
      this.currentSegment.endTime = currentTime;
      this.currentSegment.duration = currentTime - this.currentSegment.startTime;
    }

    // Continue monitoring
    if (this.isRecording && !this.isPaused) {
      this.animationFrameId = requestAnimationFrame(() => this.monitorAudioLevel());
    }
  }

  /**
   * Start recording audio
   */
  async start(): Promise<void> {
    if (!this.mediaRecorder || !this.audioContext) {
      await this.initialize();
    }

    if (!this.mediaRecorder || !this.audioContext) {
      throw new Error('Failed to initialize audio recorder');
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.segments = [];
    this.audioChunks = [];
    this.currentSegmentChunks = [];
    this.currentSegment = null;
    this.startTime = Date.now();
    this.totalPausedTime = 0;
    this.pauseTime = 0;
    this.isRecording = true;
    this.isPaused = false;

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.monitorAudioLevel();
  }

  /**
   * Pause recording (maintains state for resume)
   */
  pause(): void {
    if (!this.isRecording || this.isPaused || !this.mediaRecorder) return;

    this.isPaused = true;
    this.lastPauseStart = Date.now();
    this.mediaRecorder.pause();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.speechTimer) {
      clearTimeout(this.speechTimer);
      this.speechTimer = null;
    }
  }

  /**
   * Resume recording after pause
   */
  resume(): void {
    if (!this.isRecording || !this.isPaused || !this.mediaRecorder) return;

    const pauseDuration = Date.now() - this.lastPauseStart;
    this.totalPausedTime += pauseDuration;
    this.isPaused = false;
    this.pauseTime = this.getElapsedTime();

    this.mediaRecorder.resume();
    this.monitorAudioLevel();
  }

  /**
   * Stop recording
   */
  async stop(): Promise<AudioSegment[]> {
    if (!this.mediaRecorder || !this.isRecording) {
      return this.segments;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(this.segments);
        return;
      }

      const handleStop = () => {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }

        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (this.speechTimer) {
          clearTimeout(this.speechTimer);
          this.speechTimer = null;
        }

        // Finalize current segment
        this.finalizeSegment();

        this.isRecording = false;
        this.isPaused = false;
        this.mediaRecorder = null;

        resolve(this.segments);
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
        this.mediaRecorder.stop();
      } else {
        handleStop();
      }
    });
  }

  /**
   * Get all recorded segments
   */
  getSegments(): AudioSegment[] {
    return [...this.segments];
  }

  /**
   * Get current recording time in milliseconds
   */
  getCurrentTime(): number {
    return this.getElapsedTime();
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording && !this.isPaused;
  }

  /**
   * Check if currently paused
   */
  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Release resources
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    if (this.speechTimer) {
      clearTimeout(this.speechTimer);
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.mediaStream = null;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.analyser = null;
    this.dataArray = null;
    this.segments = [];
    this.currentSegment = null;
    this.isRecording = false;
    this.isPaused = false;
  }
}

export default AudioRecorder;
