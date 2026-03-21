/**
 * Logic Block Component
 *
 * Renders a logic gate block for boolean operations.
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  type LogicBlock,
  type LogicGateType,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';

interface LogicBlockComponentProps {
  block: LogicBlock;
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

const LOGIC_GATE_SYMBOLS: Record<LogicGateType, string> = {
  and: '∧',
  or: '∨',
  xor: '⊕',
  eq: '=',
  le: '≤',
  ge: '≥',
  gt: '>',
  lt: '<',
};

const LOGIC_GATE_COLORS: Record<LogicGateType, string> = {
  and: 'text-blue-500',
  or: 'text-green-500',
  xor: 'text-purple-500',
  eq: 'text-orange-500',
  le: 'text-cyan-500',
  ge: 'text-teal-500',
  gt: 'text-red-500',
  lt: 'text-pink-500',
};

export function LogicBlockComponent({
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
}: LogicBlockComponentProps): React.ReactElement {
  const { logicType, inputs, result } = block;

  const connectedHandleIds = new Set([
    ...(inputs || []).map((id, index) => `${block.id}-input-${index}`),
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
        <span className="font-mono">🔌</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className={cn('text-4xl font-bold', LOGIC_GATE_COLORS[logicType])}>
          {LOGIC_GATE_SYMBOLS[logicType]}
        </div>
        <div className="text-xs font-medium text-muted-foreground uppercase">
          {logicType}
        </div>
        {result !== undefined && (
          <div className="mt-2 rounded bg-primary/10 px-3 py-1 font-mono text-sm">
            ={' '}
            {typeof result === 'boolean' ? (result ? 'true' : 'false') : result}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {inputs.length} input{inputs.length !== 1 ? 's' : ''}
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

export default LogicBlockComponent;
