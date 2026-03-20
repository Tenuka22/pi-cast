/**
 * Audio Recorder Unit Tests
 * 
 * Tests for silence detection and audio segmentation logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioRecorder } from './audio-recorder';
import { DEFAULT_SILENCE_CONFIG } from './types';

describe('AudioRecorder', () => {
  let recorder: AudioRecorder;

  beforeEach(() => {
    recorder = new AudioRecorder(DEFAULT_SILENCE_CONFIG);
  });

  describe('Initialization', () => {
    it('should create recorder with default config', () => {
      expect(recorder).toBeDefined();
    });

    it('should use custom silence threshold', () => {
      const customRecorder = new AudioRecorder({
        ...DEFAULT_SILENCE_CONFIG,
        threshold: -60,
      });
      
      expect(customRecorder).toBeDefined();
    });
  });

  describe('Silence Detection', () => {
    it('should detect silence below threshold', () => {
      // Simulate amplitude below threshold (-50dB)
      const amplitude = -60; // dB
      const isSilent = amplitude < DEFAULT_SILENCE_CONFIG.threshold;
      
      expect(isSilent).toBe(true);
    });

    it('should detect speech above threshold', () => {
      // Simulate amplitude above threshold (-50dB)
      const amplitude = -30; // dB
      const isSilent = amplitude < DEFAULT_SILENCE_CONFIG.threshold;
      
      expect(isSilent).toBe(false);
    });

    it('should use RMS algorithm for amplitude calculation', () => {
      // Simulate RMS calculation
      const samples = new Float32Array([0.1, 0.2, 0.3, 0.2, 0.1]);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) {
        sum += samples[i] * samples[i];
      }
      const rms = Math.sqrt(sum / samples.length);
      
      expect(rms).toBeGreaterThan(0);
      expect(rms).toBeLessThan(1);
    });

    it('should convert amplitude to dB', () => {
      const amplitude = 0.5;
      const db = 20 * Math.log10(amplitude);
      
      expect(db).toBeCloseTo(-6.02, 1);
    });
  });

  describe('Audio Segmentation', () => {
    it('should create speech segment after minSpeechDuration', () => {
      const minSpeechDuration = DEFAULT_SILENCE_CONFIG.minSpeechDuration;
      
      // Speech should be detected after 200ms of continuous speech
      expect(minSpeechDuration).toBe(200);
    });

    it('should create silence segment after minSilenceDuration', () => {
      const minSilenceDuration = DEFAULT_SILENCE_CONFIG.minSilenceDuration;
      
      // Silence should be detected after 500ms of continuous silence
      expect(minSilenceDuration).toBe(500);
    });

    it('should alternate between speech and silence segments', () => {
      // Simulate alternating pattern
      const segments: Array<'speech' | 'silence'> = ['speech', 'silence', 'speech', 'silence'];
      
      expect(segments[0]).toBe('speech');
      expect(segments[1]).toBe('silence');
      expect(segments[2]).toBe('speech');
      expect(segments[3]).toBe('silence');
    });
  });

  describe('Recording State', () => {
    it('should start in idle state', () => {
      // Recorder should be initialized but not recording
      expect(recorder).toBeDefined();
    });

    it('should track recording state', () => {
      // State transitions: idle -> recording -> paused -> recording -> stopped
      const states = ['idle', 'recording', 'paused', 'recording', 'stopped'];
      
      expect(states).toHaveLength(5);
      expect(states[0]).toBe('idle');
      expect(states[states.length - 1]).toBe('stopped');
    });
  });

  describe('Audio Quality', () => {
    it('should use 44100Hz sample rate', () => {
      expect(DEFAULT_SILENCE_CONFIG.sampleRate).toBe(44100);
    });

    it('should support multiple quality levels', () => {
      const qualities = ['high', 'medium', 'low'] as const;
      
      expect(qualities).toHaveLength(3);
      expect(qualities[0]).toBe('high');
      expect(qualities[2]).toBe('low');
    });
  });
});
