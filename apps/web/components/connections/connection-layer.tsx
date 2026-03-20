'use client';

import React from 'react';
import { ConnectionLine } from './connection-line';
import type { BlockConnection, Block } from '@/lib/block-system/types';
import { GRID_UNIT, getBlockBoundingBox } from '@/lib/block-system/types';

interface ConnectionLayerProps {
  blocks: Block[];
  connections: BlockConnection[];
  selectedConnectionId?: string;
  onConnectionClick?: (connectionId: string) => void;
  zoom: number;
  pan: { x: number; y: number };
}

interface HandlePosition {
  x: number;
  y: number;
}

function getHandlePosition(block: Block, handleType: 'input' | 'output'): HandlePosition {
  const bbox = getBlockBoundingBox(block);
  // Connection handles are rendered as 24px circles positioned 12px outside the block edge (-left-3 / -right-3).
  const handleOffsetPx = 12;
  
  // Input handles on left side, output handles on right side
  if (handleType === 'input') {
    return {
      x: bbox.x - handleOffsetPx,
      y: bbox.y + bbox.height / 2,
    };
  } else {
    return {
      x: bbox.x + bbox.width + handleOffsetPx,
      y: bbox.y + bbox.height / 2,
    };
  }
}

export function ConnectionLayer({
  blocks,
  connections,
  selectedConnectionId,
  onConnectionClick,
  zoom,
  pan,
}: ConnectionLayerProps) {
  const blockMap = new Map(blocks.map(b => [b.id, b]));

  return (
    <svg
      className="pointer-events-auto"
      style={{ 
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        overflow: 'visible',
      }}
    >
      {connections.map((connection) => {
        const sourceBlock = blockMap.get(connection.sourceBlockId);
        const targetBlock = blockMap.get(connection.targetBlockId);

        if (!sourceBlock || !targetBlock) return null;

        const startPos = getHandlePosition(sourceBlock, 'output');
        const endPos = getHandlePosition(targetBlock, 'input');

        return (
          <ConnectionLine
            key={connection.id}
            startX={startPos.x}
            startY={startPos.y}
            endX={endPos.x}
            endY={endPos.y}
            isSelected={selectedConnectionId === connection.id}
            isAnimated={false}
            onClick={() => onConnectionClick?.(connection.id)}
          />
        );
      })}
    </svg>
  );
}
