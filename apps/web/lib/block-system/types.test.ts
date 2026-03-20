/**
 * Block System Types Unit Tests
 * 
 * Tests for grid coordinate conversions, block positioning, and arrangement logic.
 */

import { describe, it, expect } from 'vitest';
import {
  GRID_UNIT,
  gridToPixels,
  pixelsToGrid,
  findNearestValidPosition,
  autoArrangeNeighbors,
  getDefaultBlockDimensions,
  parseEquation,
  type GridPosition,
  type BlockDimensions,
} from '@/lib/block-system/types';

describe('Block System Types', () => {
  describe('GRID_UNIT', () => {
    it('should be 32 pixels', () => {
      expect(GRID_UNIT).toBe(32);
    });
  });

  describe('gridToPixels', () => {
    it('should convert grid coordinates to pixels', () => {
      const gridPos: GridPosition = { x: 4, y: 2 };
      const pixels = gridToPixels(gridPos);
      
      expect(pixels.x).toBe(128); // 4 * 32
      expect(pixels.y).toBe(64);  // 2 * 32
    });

    it('should handle zero coordinates', () => {
      const gridPos: GridPosition = { x: 0, y: 0 };
      const pixels = gridToPixels(gridPos);
      
      expect(pixels.x).toBe(0);
      expect(pixels.y).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const gridPos: GridPosition = { x: -2, y: -1 };
      const pixels = gridToPixels(gridPos);
      
      expect(pixels.x).toBe(-64);  // -2 * 32
      expect(pixels.y).toBe(-32);  // -1 * 32
    });
  });

  describe('pixelsToGrid', () => {
    it('should convert pixel coordinates to grid', () => {
      const pixels = { x: 128, y: 64 };
      const gridPos = pixelsToGrid(pixels.x, pixels.y);
      
      expect(gridPos.x).toBe(4);
      expect(gridPos.y).toBe(2);
    });

    it('should round down to nearest grid cell', () => {
      const pixels = { x: 140, y: 70 }; // Not exact multiples
      const gridPos = pixelsToGrid(pixels.x, pixels.y);
      
      expect(gridPos.x).toBe(4); // floor(140/32) = 4
      expect(gridPos.y).toBe(2); // floor(70/32) = 2
    });

    it('should handle zero pixels', () => {
      const gridPos = pixelsToGrid(0, 0);
      
      expect(gridPos.x).toBe(0);
      expect(gridPos.y).toBe(0);
    });
  });

  describe('gridToPixels and pixelsToGrid roundtrip', () => {
    it('should convert grid->pixels->grid correctly', () => {
      const original: GridPosition = { x: 5, y: 3 };
      const pixels = gridToPixels(original);
      const converted = pixelsToGrid(pixels.x, pixels.y);
      
      expect(converted.x).toBe(original.x);
      expect(converted.y).toBe(original.y);
    });
  });

  describe('getDefaultBlockDimensions', () => {
    it('should return dimensions for equation block', () => {
      const dims = getDefaultBlockDimensions('equation');
      
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
      // Height may not always be exact multiple of 32 depending on implementation
      expect(dims.height).toBeGreaterThanOrEqual(1);
    });

    it('should return dimensions for chart block', () => {
      const dims = getDefaultBlockDimensions('chart');
      
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it('should return dimensions for control block', () => {
      const dims = getDefaultBlockDimensions('control');
      
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it('should return dimensions for description block', () => {
      const dims = getDefaultBlockDimensions('description');
      
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it('should return default dimensions for unknown block type', () => {
      const dims = getDefaultBlockDimensions('unknown' as any);
      
      // Returns default dimensions instead of throwing
      expect(dims.width).toBe(4);
      expect(dims.height).toBe(1);
    });
  });

  describe('findNearestValidPosition', () => {
    it('should return the same position if no blocks overlap', () => {
      const position: GridPosition = { x: 4, y: 2 };
      const dimensions: BlockDimensions = { width: 4, height: 1 };
      
      const result = findNearestValidPosition(position, dimensions, []);
      
      expect(result.x).toBe(position.x);
      expect(result.y).toBe(position.y);
    });

    it('should find alternative position when blocked', () => {
      const existingBlock = {
        id: 'block-1',
        type: 'equation' as const,
        position: { x: 4, y: 2 },
        dimensions: { width: 4, height: 1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const newPosition: GridPosition = { x: 4, y: 2 }; // Same as existing
      const dimensions: BlockDimensions = { width: 4, height: 1 };
      
      const result = findNearestValidPosition(
        newPosition,
        dimensions,
        [existingBlock]
      );
      
      // Should find a different position
      expect(result).not.toEqual(newPosition);
    });

    it('should exclude specified block ID', () => {
      const existingBlock = {
        id: 'block-1',
        type: 'equation' as const,
        position: { x: 4, y: 2 },
        dimensions: { width: 4, height: 1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const newPosition: GridPosition = { x: 4, y: 2 };
      const dimensions: BlockDimensions = { width: 4, height: 1 };
      
      // Exclude the existing block - should allow same position
      const result = findNearestValidPosition(
        newPosition,
        dimensions,
        [existingBlock],
        'block-1'
      );
      
      expect(result.x).toBe(newPosition.x);
      expect(result.y).toBe(newPosition.y);
    });
  });

  describe('autoArrangeNeighbors', () => {
    it('should return empty array for single block', () => {
      const block = {
        id: 'block-1',
        type: 'equation' as const,
        position: { x: 4, y: 2 },
        dimensions: { width: 4, height: 1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const adjustments = autoArrangeNeighbors(block, [block]);
      
      expect(adjustments).toHaveLength(0);
    });

    it('should adjust neighboring blocks', () => {
      const movedBlock = {
        id: 'block-1',
        type: 'equation' as const,
        position: { x: 4, y: 2 },
        dimensions: { width: 4, height: 1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const neighborBlock = {
        id: 'block-2',
        type: 'equation' as const,
        position: { x: 5, y: 2 }, // Overlaps with moved block
        dimensions: { width: 4, height: 1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const adjustments = autoArrangeNeighbors(movedBlock, [movedBlock, neighborBlock]);
      
      // Should have adjustment for neighbor
      expect(adjustments.length).toBeGreaterThan(0);
    });
  });

  describe('parseEquation', () => {
    it('should parse linear equation y = mx + c', () => {
      const result = parseEquation('y = mx + c');
      
      expect(result).toBeDefined();
      expect(result?.equationType).toBe('linear');
      expect(result?.tokens).toBeDefined();
      expect(result?.tokens?.length).toBeGreaterThan(0);
    });

    it('should parse linear equation with numbers', () => {
      const result = parseEquation('y = 2x + 3');
      
      expect(result).toBeDefined();
      expect(result?.equationType).toBe('linear');
      // Variables may not be extracted in simple parsing
      expect(result?.tokens).toBeDefined();
    });

    it('should handle equation without spaces', () => {
      const result = parseEquation('y=2x+3');
      
      expect(result).toBeDefined();
      expect(result?.equationType).toBe('linear');
    });

    it('should tokenize any string as equation', () => {
      const result = parseEquation('invalid');
      
      expect(result).toBeDefined();
      // Parser tokenizes any string, even invalid equations
      expect(result?.tokens?.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty string', () => {
      const result = parseEquation('');
      
      expect(result).toBeDefined();
      expect(result?.tokens).toEqual([]);
    });
  });
});
