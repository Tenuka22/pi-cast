'use client';

import { useState, useCallback } from 'react';
import { GridCanvas } from '@/components/blocks/grid-canvas';
import { BlockLibrary } from '@/components/blocks/block-library';
import type { BlockPreset } from '@/components/blocks/block-library';
import type { Block, NodeChain, GridPosition } from '@/lib/block-system/types';
import {
  findNearestValidPosition,
  parseEquation,
  createNodeChain,
} from '@/lib/block-system/types';
import { useUserRole } from '@/hooks/use-user-role';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import Link from 'next/link';

/**
 * Canvas Page - Main workspace for node tree-based math visualization.
 *
 * NODE TREE ARCHITECTURE:
 * - Each block has a nodeChainId that links it to a chain structure
 * - Chains have prev (input) and next (output) pointers
 * - Data flows from source nodes through the chain
 * - Charts can traverse back through the chain to get all inputs
 *
 * Features:
 * - Chain-based connections (add to beginning or end of chain)
 * - Visual chain indicators showing data flow
 * - Easy tracking of data through the pipeline
 * - Support for branching (one node -> multiple outputs)
 *
 * Example chains:
 * 1. Equation -> Variable Slider -> Limiter -> Chart
 * 2. Equation (x=2) -> Equation (y=3) -> Equation (y=x) -> Chart -> Shape
 * 3. Limiter (x approaching 10) -> Chart (shows all near values)
 *
 * Recording Permissions:
 * - Only admins and creators can record lessons
 * - Students can use the canvas but cannot record
 */
export default function CanvasPage() {
  return (
    <AuthGuard>
      <CanvasContent />
    </AuthGuard>
  );
}

function CanvasContent() {
  const { canRecord, isCreator, isAdmin } = useUserRole();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [nodeChains, setNodeChains] = useState<Map<string, NodeChain>>(new Map());

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
      case 'table': {
        const autoGenerateRows = preset.data.autoGenerateRows ?? true;
        const variableName = preset.data.variableName ?? 'x';
        const showGrid = preset.data.showGrid ?? true;
        const highlightLastRow = preset.data.highlightLastRow ?? true;
        return {
          ...baseBlock,
          type: 'table',
          sourceEquationId: null,
          sourceLimitId: null,
          columns: [],
          rows: [],
          autoGenerateRows,
          variableName,
          showGrid,
          highlightLastRow,
        };
      }
    }
  };

  /**
   * Create a new node chain for a block
   */
  const createNodeChainForBlock = useCallback((block: Block): NodeChain => {
    const chain = createNodeChain(
      block.id,
      block.type,
      block.position,
      block.dimensions
    );
    setNodeChains((prev) => new Map(prev).set(chain.id, chain));
    return chain;
  }, []);

  /**
   * Connect two blocks in a chain (source -> target)
   * This creates a directional data flow from source to target
   */
  const connectBlocks = useCallback((sourceBlockId: string, targetBlockId: string) => {
    setNodeChains((prevChains) => {
      const newChains = new Map(prevChains);
      const sourceChain = Array.from(newChains.values()).find((c) => c.nodeId === sourceBlockId);
      const targetChain = Array.from(newChains.values()).find((c) => c.nodeId === targetBlockId);

      if (sourceChain && targetChain) {
        const { connectNodeChains } = require('@/lib/block-system/types') as typeof import('@/lib/block-system/types');
        connectNodeChains(sourceChain, targetChain, newChains);
      }

      return newChains;
    });
  }, []);

  /**
   * Disconnect two blocks in a chain
   */
  const disconnectBlocks = useCallback((sourceBlockId: string, targetBlockId: string) => {
    setNodeChains((prevChains) => {
      const newChains = new Map(prevChains);
      const sourceChain = Array.from(newChains.values()).find((c) => c.nodeId === sourceBlockId);
      const targetChain = Array.from(newChains.values()).find((c) => c.nodeId === targetBlockId);

      if (sourceChain && targetChain) {
        const { disconnectNodeChains } = require('@/lib/block-system/types') as typeof import('@/lib/block-system/types');
        disconnectNodeChains(sourceChain, targetChain, newChains);
      }

      return newChains;
    });
  }, []);

  const handleBlockDrop = (preset: BlockPreset, position: GridPosition) => {
    const newBlock = createBlockFromPreset(preset, position);
    const validPosition = findNearestValidPosition(position, { width: 4, height: 2 }, blocks);
    const blockWithPosition = { ...newBlock, position: validPosition };
    
    // Create a node chain for the new block
    const chain = createNodeChain(blockWithPosition.id, blockWithPosition.type, validPosition, blockWithPosition.dimensions);
    setNodeChains((prev) => new Map(prev).set(chain.id, chain));
    
    setBlocks((prev) => [...prev, blockWithPosition]);
  };

  const handleBlockSelect = (preset: BlockPreset) => {
    const centerPosition: GridPosition = { x: 10, y: 10 };
    const newBlock = createBlockFromPreset(preset, centerPosition);
    const validPosition = findNearestValidPosition(centerPosition, { width: 4, height: 2 }, blocks);
    const blockWithPosition = { ...newBlock, position: validPosition };
    
    // Create a node chain for the new block
    const chain = createNodeChain(blockWithPosition.id, blockWithPosition.type, validPosition, blockWithPosition.dimensions);
    setNodeChains((prev) => new Map(prev).set(chain.id, chain));
    
    setBlocks((prev) => [...prev, blockWithPosition]);
  };

  const handleBlocksChange = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  return (
    <div className="flex h-screen w-full">
      <BlockLibrary onBlockSelect={handleBlockSelect} />
      <div className="flex-1 space-y-4">
        {!canRecord && (
          <div className="container mx-auto p-4">
            <Alert variant="default">
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {isAdmin || isCreator
                    ? "You can record lessons now."
                    : "Recording is only available for creators and admins. Upgrade to creator to record lessons."}
                </span>
                {!isCreator && !isAdmin && (
                  <Link href="/dashboard/settings">
                    <Button variant="outline" size="sm">Become a Creator</Button>
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
        <GridCanvas
          blocks={blocks}
          nodeChains={nodeChains}
          onBlocksChange={handleBlocksChange}
          onNodeChainsChange={setNodeChains}
          onBlockDrop={handleBlockDrop}
          onConnectBlocks={connectBlocks}
          onDisconnectBlocks={disconnectBlocks}
          canRecord={canRecord}
        />
      </div>
    </div>
  );
}
