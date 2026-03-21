/**
 * Comparator Block Component
 *
 * Renders a comparator block for numeric comparisons (<=, >=, >, <, =).
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  type ComparatorBlock,
  type LogicGateType,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';

interface ComparatorBlockComponentProps {
  block: ComparatorBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
}

const COMPARATOR_SYMBOLS: Record<LogicGateType, string> = {
  lt: '<',
  gt: '>',
  le: '≤',
  ge: '≥',
  eq: '=',
  and: '∧',
  or: '∨',
  xor: '⊕',
};

const COMPARATOR_COLORS: Record<LogicGateType, string> = {
  lt: 'text-cyan-500',
  gt: 'text-teal-500',
  le: 'text-indigo-500',
  ge: 'text-violet-500',
  eq: 'text-orange-500',
  and: 'text-blue-500',
  or: 'text-green-500',
  xor: 'text-purple-500',
};

export function ComparatorBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onDimensionsChange,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: ComparatorBlockComponentProps): React.ReactElement {
  const { operator, leftInput, rightInput, result } = block;

  const connectedHandleIds = new Set([
    ...(leftInput ? [`${block.id}-left`] : []),
    ...(rightInput ? [`${block.id}-right`] : []),
    ...(block.output ? [`${block.id}-output`] : []),
  ]);

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDimensionsChange={onDimensionsChange}
      className="p-4"
    >
      <div className="absolute -top-3 left-3 flex items-center gap-1 rounded bg-card px-2 text-xs text-muted-foreground">
        <span className="font-mono">⚖️</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className={cn('text-4xl font-bold', COMPARATOR_COLORS[operator])}>
          {COMPARATOR_SYMBOLS[operator]}
        </div>
        <div className="text-xs font-medium text-muted-foreground uppercase">
          {operator}
        </div>
        {result !== undefined && (
          <div className="mt-2 rounded bg-primary/10 px-3 py-1 font-mono text-sm">
            ={' '}
            {typeof result === 'boolean' ? (result ? 'true' : 'false') : result}
          </div>
        )}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>left: {leftInput ? '●' : '○'}</span>
          <span>right: {rightInput ? '●' : '○'}</span>
        </div>
      </div>
      <ConnectionHandles
        blockId={block.id}
        blockType={block.type}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
        isConnecting={isConnecting}
        connectingFromType={connectingFromType}
        connectedHandles={connectedHandleIds}
      />
    </BlockWrapper>
  );
}

export default ComparatorBlockComponent;
