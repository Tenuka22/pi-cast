/**
 * Variable Block Component
 *
 * Renders a variable block with sliders for controlling equation variables.
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  type VariableBlock,
  type ConnectionHandleType,
} from '@/lib/block-system/types';
import { BlockWrapper } from './block-wrapper';
import { ConnectionHandles } from '@/components/connections/connection-handles';
import { ControlVariableInput } from './control-variable-input';

interface VariableBlockComponentProps {
  block: VariableBlock;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onVariableChange?: (variableName: string, value: number) => void;
  onConnectionStart?: (
    handleId: string,
    handleType: ConnectionHandleType
  ) => void;
  onConnectionEnd?: (handleId: string, handleType: ConnectionHandleType) => void;
  isConnecting?: boolean;
  connectingFromType?: string;
}

export function VariableBlockComponent({
  block,
  isSelected,
  isDragging = false,
  onClick,
  onMouseDown,
  onVariableChange,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectingFromType,
}: VariableBlockComponentProps): React.ReactElement {
  const { variables = [], layout } = block;

  const connectedHandleIds = new Set(
    block.sourceEquationId
      ? [`${block.id}-input-equation-${block.sourceEquationId}`]
      : []
  );

  return (
    <BlockWrapper
      block={block}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">🎚️</span>
          <span className="text-xs text-muted-foreground">
            {variables.length} variable{variables.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4">
        {variables.length > 0 ? (
          <div
            className={cn(
              'space-y-4',
              layout === 'horizontal' ? 'flex gap-4' : ''
            )}
          >
            {variables.map((variable) => (
              <ControlVariableInput
                key={variable.name}
                variable={variable}
                onChange={(value) => onVariableChange?.(variable.name, value)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect to an equation to see variables
          </p>
        )}
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

export default VariableBlockComponent;
