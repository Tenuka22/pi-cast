'use client';

import { useState } from 'react';
import { GridCanvas } from '@/components/blocks/grid-canvas';
import { BlockLibrary } from '@/components/blocks/block-library';
import type { BlockPreset } from '@/components/blocks/block-library';
import type { Block } from '@/lib/block-system/types';
import {
  type GridPosition,
  findNearestValidPosition,
  getDefaultBlockDimensions,
  parseEquation,
} from '@/lib/block-system/types';

/**
 * Canvas Page - Main workspace for block-based math visualization.
 * Features:
 * - Double-click equations to edit constants
 * - Hover sliders for constants (default step: 10)
 * - Logic gates (AND, OR, XOR, EQ) for connections
 * - Editable descriptions
 * - Chart visualization from connected equations
 * - Shape connections and value adjustments
 */
export default function CanvasPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const createBlockFromPreset = (preset: BlockPreset, position: GridPosition): Block => {
    const baseBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    switch (preset.type) {
      case 'equation': {
        const equation = preset.data.equation ?? '';
        const parsed = parseEquation(equation);
        return {
          ...baseBlock,
          type: 'equation',
          dimensions: getDefaultBlockDimensions('equation'),
          equation,
          tokens: parsed?.tokens,
          variables: parsed?.variables,
          equationType: parsed?.equationType,
        };
      }
      case 'chart':
        return {
          ...baseBlock,
          type: 'chart',
          dimensions: getDefaultBlockDimensions('chart'),
          equations: [],
        };
      case 'description': {
        const format = preset.data.format ?? 'plain';
        return {
          ...baseBlock,
          type: 'description',
          dimensions: getDefaultBlockDimensions('description'),
          content: 'Double-click to edit...',
          format,
        };
      }
      case 'limit': {
        const variableName = preset.data.variableName ?? 'x';
        const limitValue = preset.data.limitValue ?? 0;
        const approach = preset.data.approach ?? 'both';
        return {
          ...baseBlock,
          type: 'limit',
          dimensions: getDefaultBlockDimensions('limit'),
          variableName,
          limitValue,
          approach,
        };
      }
      case 'shape': {
        const shapeType = preset.data.shapeType ?? 'square';
        const fillColor = preset.data.fillColor ?? '#7c3aed';
        const fillValue = preset.data.fillValue ?? 50;
        const fillMode = preset.data.fillMode ?? 'percentage';
        return {
          ...baseBlock,
          type: 'shape',
          dimensions: getDefaultBlockDimensions('shape'),
          shapeType,
          fillColor,
          fillValue,
          fillMode,
          showGrid: true,
          rows: 10,
          cols: 10,
        };
      }
      case 'logic': {
        const logicType = preset.data.logicType ?? 'and';
        return {
          ...baseBlock,
          type: 'logic',
          dimensions: getDefaultBlockDimensions('logic'),
          logicType,
          inputs: [],
          output: null,
        };
      }
    }
  };

  const handleBlockDrop = (preset: BlockPreset, position: GridPosition) => {
    const validPosition = findNearestValidPosition(position, getDefaultBlockDimensions(preset.type), blocks);
    const newBlock = createBlockFromPreset(preset, validPosition);
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleBlockSelect = (preset: BlockPreset) => {
    // Click to add block at center of viewport
    const centerPosition: GridPosition = { x: 10, y: 10 };
    const validPosition = findNearestValidPosition(centerPosition, getDefaultBlockDimensions(preset.type), blocks);
    const newBlock = createBlockFromPreset(preset, validPosition);
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleBlocksChange = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  return (
    <div className="flex h-screen w-full">
      <BlockLibrary onBlockSelect={handleBlockSelect} />
      <div className="flex-1">
        <GridCanvas blocks={blocks} onBlocksChange={handleBlocksChange} onBlockDrop={handleBlockDrop} />
      </div>
    </div>
  );
}
