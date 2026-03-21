'use client';

import { useState } from 'react';
import { GridCanvas } from '@/components/blocks/grid-canvas';
import { BlockLibrary } from '@/components/blocks/block-library';
import type { BlockPreset } from '@/components/blocks/block-library';
import type { Block } from '@/lib/block-system/types';
import {
  type GridPosition,
  findNearestValidPosition,
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
 *
 * Note: Block dimensions are now auto-calculated based on content.
 * The CanvasNode system handles rendering with minimal styling (p-1).
 */
export default function CanvasPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const createBlockFromPreset = (preset: BlockPreset, position: GridPosition): Block => {
    const baseBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dimensions: { width: 0, height: 0 },
    };

    switch (preset.type) {
      case 'equation': {
        const equation = preset.data.equation ?? '';
        const parsed = parseEquation(equation);
        return {
          ...baseBlock,
          type: 'equation',
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
          equations: [],
          dimensions: preset.data.dimensions ?? baseBlock.dimensions,
        };
      case 'description': {
        const format = preset.data.format ?? 'plain';
        return {
          ...baseBlock,
          type: 'description',
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
          logicType,
          inputs: [],
          output: null,
        };
      }
      case 'comparator': {
        const operator = preset.data.operator ?? 'eq';
        return {
          ...baseBlock,
          type: 'comparator',
          operator,
          leftInput: null,
          rightInput: null,
          output: null,
        };
      }
      case 'constraint': {
        const variableName = preset.data.variableName ?? 'x';
        const constraintType = preset.data.constraintType ?? 'gte';
        const constraintValue = preset.data.constraintValue ?? 0;
        return {
          ...baseBlock,
          type: 'constraint',
          variableName,
          constraint: {
            type: constraintType,
            min: constraintType === 'range' ? constraintValue : constraintValue,
            max: constraintType === 'range' ? 100 : undefined,
          },
          targetEquationId: null,
          output: null,
        };
      }
      case 'variable': {
        const layout = preset.data.layout ?? 'vertical';
        return {
          ...baseBlock,
          type: 'variable',
          layout,
          variables: [],
        };
      }
    }
  };

  const handleBlockDrop = (preset: BlockPreset, position: GridPosition) => {
    const newBlock = createBlockFromPreset(preset, position);
    const validPosition = findNearestValidPosition(position, { width: 4, height: 2 }, blocks);
    const blockWithPosition = { ...newBlock, position: validPosition };
    setBlocks((prev) => [...prev, blockWithPosition]);
  };

  const handleBlockSelect = (preset: BlockPreset) => {
    const centerPosition: GridPosition = { x: 10, y: 10 };
    const newBlock = createBlockFromPreset(preset, centerPosition);
    const validPosition = findNearestValidPosition(centerPosition, { width: 4, height: 2 }, blocks);
    const blockWithPosition = { ...newBlock, position: validPosition };
    setBlocks((prev) => [...prev, blockWithPosition]);
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
